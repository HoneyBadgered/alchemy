/**
 * Cart Service
 * Handles cart operations for both authenticated users and guests
 */

import { prisma } from '../utils/prisma';
import { getIngredientById } from '@alchemy/core';
import {
  BadRequestError,
  NotFoundError,
  InsufficientStockError,
  CartError,
} from '../utils/errors';
import type { Prisma } from '@prisma/client';

// Constants for custom blend products
const CUSTOM_BLEND_BASE_PRICE = 12.99;
const CUSTOM_BLEND_PRICE_PER_GRAM = 0.15; // Price per gram of add-in ingredients
const CUSTOM_BLEND_STOCK = 999; // Custom blends are always "in stock"

interface AddToCartParams {
  productId: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
  variantId?: string;
}

interface UpdateCartItemParams {
  productId: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
  variantId?: string;
}

interface RemoveFromCartParams {
  productId: string;
  userId?: string;
  sessionId?: string;
}

interface GetCartParams {
  userId?: string;
  sessionId?: string;
}

export class CartService {
  /**
   * Get or create a cart for user or guest
   */
  private async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new BadRequestError('Either userId or sessionId must be provided');
    }

    // Use upsert to handle race conditions automatically
    // Construct the unique identifier
    const where = userId 
      ? { userId } 
      : sessionId 
      ? { sessionId } 
      : { userId: 'impossible' }; // Fallback that won't match

    let cart;
    
    try {
      // For user carts, use upsert
      if (userId) {
        cart = await prisma.carts.upsert({
          where: { userId },
          update: {
            updatedAt: new Date(),
          },
          create: {
            id: crypto.randomUUID(),
            userId,
            sessionId: null,
            updatedAt: new Date(),
          },
          include: {
            cart_items: {
              include: {
                products: true,
                product_variants: true,
              },
            },
          },
        });
      } else if (sessionId) {
        // For session carts, use upsert
        cart = await prisma.carts.upsert({
          where: { sessionId },
          update: {
            updatedAt: new Date(),
          },
          create: {
            id: crypto.randomUUID(),
            userId: null,
            sessionId,
            updatedAt: new Date(),
          },
          include: {
            cart_items: {
              include: {
                products: true,
                product_variants: true,
              },
            },
          },
        });
      }
    } catch (error: unknown) {
      const prismaError = error as { code?: string };
      // If still a race condition somehow, fall back to findFirst
      if (prismaError?.code === 'P2002') {
        cart = await prisma.carts.findFirst({
          where,
          include: {
            cart_items: {
              include: {
                products: true,
                product_variants: true,
              },
            },
          },
        });
      } else {
        throw error;
      }
    }

    if (!cart) {
      throw new Error('Failed to create or retrieve cart');
    }

    return cart;
  }

  /**
   * Get cart with items
   */
  async getCart({ userId, sessionId }: GetCartParams) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // Calculate cart totals (use variant price if available, otherwise product price)
    const subtotal = cart.cart_items.reduce((sum: number, item) => {
      const price = item.product_variants?.price || item.products.price;
      return sum + Number(price) * item.quantity;
    }, 0);

    const itemCount = cart.cart_items.reduce((sum: number, item) => sum + item.quantity, 0);

    return {
      cart,
      subtotal,
      itemCount,
    };
  }

  /**
   * Add item to cart with optional variant
   */
  async addToCart({ productId, quantity, userId, sessionId, variantId }: AddToCartParams) {
    return this.addToCartWithVariant({ productId, variantId, quantity, userId, sessionId });
  }

  /**
   * Add item to cart with variant support
   */
  private async addToCartWithVariant({ 
    productId, 
    variantId, 
    quantity, 
    userId, 
    sessionId 
  }: {
    productId: string;
    variantId?: string;
    quantity: number;
    userId?: string;
    sessionId?: string;
  }) {
    // Validate quantity
    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    // Validate product exists and is active
    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        product_variants: variantId ? {
          where: { id: variantId },
        } : true,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    if (!product.isActive) {
      throw new CartError('Product is not available for purchase');
    }

    // If product has variants, validate variant
    let variant = null;
    let stockToCheck = product.stock;
    let priceToUse = product.price;

    if (product.hasVariants) {
      if (!variantId) {
        // If no variant specified, use default
        variant = await prisma.product_variants.findFirst({
          where: {
            productId,
            isDefault: true,
            isActive: true,
          },
        });
        if (!variant) {
          throw new CartError('Please select a size for this product');
        }
      } else {
        variant = product.product_variants.find(v => v.id === variantId);
        if (!variant) {
          throw new NotFoundError('Variant not found');
        }
        if (!variant.isActive) {
          throw new CartError('This size is not available');
        }
      }
      stockToCheck = variant.stock;
      priceToUse = variant.price;
    }

    if (stockToCheck < quantity) {
      throw new InsufficientStockError(
        `Insufficient stock for ${product.name}`,
        { available: stockToCheck, requested: quantity }
      );
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    // Check if item already exists in cart (same product + variant combo)
    const existingItem = await prisma.cart_items.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
      },
    });

    try {
      if (existingItem) {
        // Update quantity
        const newQuantity = existingItem.quantity + quantity;
        
        if (stockToCheck < newQuantity) {
          throw new InsufficientStockError(
            `Insufficient stock for ${product.name}`,
            { available: stockToCheck, requested: newQuantity }
          );
        }

        await prisma.cart_items.update({
          where: { id: existingItem.id },
          data: { 
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new cart item
        await prisma.cart_items.create({
          data: {
            id: crypto.randomUUID(),
            cartId: cart.id,
            productId,
            variantId: variantId || null,
            quantity,
            updatedAt: new Date(),
          },
        });
      }
    } catch (error) {
      // Re-throw known errors
      if (error instanceof InsufficientStockError || 
          error instanceof CartError ||
          error instanceof BadRequestError) {
        throw error;
      }
      
      console.error('Failed to add item to cart:', error);
      throw new CartError('Failed to add item to cart');
    }

    return this.getCart({ userId, sessionId });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem({ productId, quantity, userId, sessionId }: UpdateCartItemParams) {
    if (quantity < 1) {
      throw new BadRequestError('Quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    const cartItem = await prisma.cart_items.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: {
        products: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Item not found in cart');
    }

    if (!cartItem.products.isActive) {
      throw new CartError('Product is no longer available');
    }

    if (cartItem.products.stock < quantity) {
      throw new InsufficientStockError(
        `Insufficient stock for ${cartItem.products.name}`,
        { available: cartItem.products.stock, requested: quantity }
      );
    }

    try {
      await prisma.cart_items.update({
        where: { id: cartItem.id },
        data: { quantity },
      });
    } catch (error) {
      console.error('Failed to update cart item:', error);
      throw new CartError('Failed to update cart item');
    }

    return this.getCart({ userId, sessionId });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart({ productId, userId, sessionId }: RemoveFromCartParams) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    await prisma.cart_items.deleteMany({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    return this.getCart({ userId, sessionId });
  }

  /**
   * Clear all items from cart
   */
  async clearCart({ userId, sessionId }: GetCartParams) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    await prisma.cart_items.deleteMany({
      where: {
        cartId: cart.id,
      },
    });

    return this.getCart({ userId, sessionId });
  }

  /**
   * Merge guest cart with user cart (after login)
   */
  async mergeGuestCart(userId: string, sessionId: string) {
    const guestCart = await prisma.carts.findUnique({
      where: { sessionId },
      include: {
        cart_items: true,
      },
    });

    if (!guestCart || guestCart.cart_items.length === 0) {
      return this.getCart({ userId });
    }

    try {
      // Get or create user cart
      const userCart = await this.getOrCreateCart(userId);

      // Merge items and delete guest cart in a transaction
      await prisma.$transaction(async (tx) => {
        // Merge items
        for (const guestItem of guestCart.cart_items) {
          const existingItem = await tx.cart_items.findUnique({
            where: {
              cartId_productId: {
                cartId: userCart.id,
                productId: guestItem.productId,
              },
            },
          });

          if (existingItem) {
            // Update quantity
            await tx.cart_items.update({
              where: { id: existingItem.id },
              data: { quantity: existingItem.quantity + guestItem.quantity },
            });
          } else {
            // Add new item to user cart
            await tx.cart_items.update({
              where: { id: guestItem.id },
              data: { cartId: userCart.id },
            });
          }
        }

        // Delete guest cart
        await tx.carts.delete({
          where: { id: guestCart.id },
        });
      });
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
      throw new CartError('Failed to merge shopping carts');
    }

    return this.getCart({ userId });
  }

  /**
   * Add custom blend to cart
   * Creates a product for the blend if it doesn't exist, saves the blend, then adds to cart
   * Validates ingredient availability before adding to cart
   */
  async addBlendToCart({
    baseTeaId,
    addIns,
    userId,
    sessionId,
    blendName,
    size = 2,
  }: {
    baseTeaId: string;
    addIns: Array<{ ingredientId: string; quantity: number }>;
    userId?: string;
    sessionId?: string;
    blendName?: string;
    size?: number;
  }) {
    // INGREDIENT AVAILABILITY VALIDATION
    // Check that all required ingredients have sufficient inventory
    const ingredientIds = [baseTeaId, ...addIns.map(a => a.ingredientId)];
    const ingredients = await prisma.ingredients.findMany({
      where: { id: { in: ingredientIds } },
      select: { id: true, name: true, inventoryAmount: true, status: true },
    });

    // Create a map for quick lookup
    const ingredientMap = new Map(ingredients.map(i => [i.id, i]));

    // Validate base tea
    const baseTea = ingredientMap.get(baseTeaId);
    if (!baseTea) {
      throw new NotFoundError(`Base tea with ID "${baseTeaId}" not found`);
    }

    if (baseTea.status !== 'active') {
      throw new CartError(`Base tea "${baseTea.name}" is not currently available`);
    }

    // Each blend requires 1 unit of base tea (can be adjusted if needed)
    if (Number(baseTea.inventoryAmount) < 1) {
      throw new InsufficientStockError(
        `Insufficient inventory for base tea "${baseTea.name}"`,
        { 
          ingredientId: baseTea.id,
          ingredientName: baseTea.name,
          requested: 1,
          available: Number(baseTea.inventoryAmount),
        }
      );
    }

    // Validate add-ins
    for (const addIn of addIns) {
      const ingredient = ingredientMap.get(addIn.ingredientId);
      
      if (!ingredient) {
        throw new NotFoundError(`Add-in ingredient with ID "${addIn.ingredientId}" not found`);
      }

      if (ingredient.status !== 'active') {
        throw new CartError(`Ingredient "${ingredient.name}" is not currently available`);
      }

      if (Number(ingredient.inventoryAmount) < addIn.quantity) {
        throw new InsufficientStockError(
          `Insufficient inventory for ingredient "${ingredient.name}"`,
          { 
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            requested: addIn.quantity,
            available: Number(ingredient.inventoryAmount),
          }
        );
      }
    }

    // Generate a unique product ID based on blend composition
    const blendKey = this.generateBlendKey(baseTeaId, addIns);
    
    // Look for existing blend product with same composition
    let product = await prisma.products.findFirst({
      where: {
        category: 'custom-blend',
        tags: { has: blendKey },
      },
      include: {
        product_variants: true,
      },
    });

    // If product doesn't exist, create it with variants
    if (!product) {
      // Calculate price based on base tea and add-ins with increment pricing
      const totalPrice = this.calculateBlendPrice(addIns);

      // Generate blend name
      const productName = blendName || this.generateBlendName(baseTea.name, addIns);

      // Create product with hasVariants flag
      product = await prisma.products.create({
        data: {
          id: crypto.randomUUID(),
          name: productName,
          description: `Custom blend with ${baseTea.name} base and ${addIns.length} add-in${addIns.length === 1 ? '' : 's'}`,
          price: totalPrice,
          category: 'custom-blend',
          tags: [blendKey, 'custom', 'blend'],
          isActive: true,
          stock: 0, // Stock is tracked per variant
          hasVariants: true,
          updatedAt: new Date(),
        },
        include: {
          product_variants: true,
        },
      });
    }

    // Find or create variant for the selected size
    let variant = product.product_variants.find(v => v.size === size);
    
    if (!variant) {
      variant = await prisma.product_variants.create({
        data: {
          id: crypto.randomUUID(),
          productId: product.id,
          name: `${size}oz`,
          size,
          price: product.price,
          stock: CUSTOM_BLEND_STOCK,
          isActive: true,
          isDefault: product.product_variants.length === 0,
          sortOrder: size,
        },
      });
    }

    // Save the blend record for persistence (linked to product, not variant)
    await prisma.blends.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId || null,
        sessionId: sessionId || null,
        name: blendName || null,
        baseTeaId,
        addIns: addIns as Prisma.InputJsonValue,
        size,
        productId: product.id,
      },
    });

    // Add the blend variant to cart
    return this.addToCartWithVariant({
      productId: product.id,
      variantId: variant.id,
      quantity: 1,
      userId,
      sessionId,
    });
  }

  /**
   * Calculate the price for a custom blend based on add-in quantities
   * Price = Base price + (total grams of add-ins × price per gram)
   */
  private calculateBlendPrice(addIns: Array<{ ingredientId: string; quantity: number }>): number {
    let totalPrice = CUSTOM_BLEND_BASE_PRICE;

    // Calculate total grams of add-ins
    const totalAddInGrams = addIns.reduce((sum, addIn) => sum + addIn.quantity, 0);
    
    // Add pricing based on total grams
    totalPrice += totalAddInGrams * CUSTOM_BLEND_PRICE_PER_GRAM;

    // Round to 2 decimal places
    return Math.round(totalPrice * 100) / 100;
  }

  /**
   * Generate a unique key for blend composition
   */
  private generateBlendKey(baseTeaId: string, addIns: Array<{ ingredientId: string; quantity: number }>): string {
    const sortedAddIns = [...addIns].sort((a, b) => a.ingredientId.localeCompare(b.ingredientId));
    const addInString = sortedAddIns.map(a => `${a.ingredientId}:${a.quantity}`).join(',');
    return `blend:${baseTeaId}:${addInString}`;
  }

  /**
   * Generate a readable name for the blend
   */
  private generateBlendName(baseTeaName: string, addIns: Array<{ ingredientId: string; quantity: number }>): string {
    const addInCount = addIns.length;
    if (addInCount === 0) {
      return `Custom ${baseTeaName}`;
    }
    return `Custom ${baseTeaName} Blend with ${addInCount} Add-in${addInCount === 1 ? '' : 's'}`;
  }

  /**
   * Get blend details by cart item ID
   * Returns blend composition, ingredients, size, price, and metadata
   */
  async getBlendByCartItemId({
    cartItemId,
    userId,
    sessionId,
  }: {
    cartItemId: string;
    userId?: string;
    sessionId?: string;
  }) {
    // Get cart item with product and variant
    const cartItem = await prisma.cart_items.findUnique({
      where: { id: cartItemId },
      include: {
        products: true,
        product_variants: true,
        carts: true,
      },
    });

    if (!cartItem) {
      throw new NotFoundError('Cart item not found');
    }

    // Verify this cart item belongs to the user/session
    if (userId && cartItem.carts.userId !== userId) {
      throw new NotFoundError('Cart item not found');
    }
    if (sessionId && cartItem.carts.sessionId !== sessionId) {
      throw new NotFoundError('Cart item not found');
    }

    // Check if this is a custom blend
    if (cartItem.products.category !== 'custom-blend') {
      throw new BadRequestError('This cart item is not a custom blend');
    }

    // Find the blend record associated with this product
    const blend = await prisma.blends.findFirst({
      where: {
        productId: cartItem.productId,
        OR: [
          { userId: userId || undefined },
          { sessionId: sessionId || undefined },
        ],
      },
    });

    if (!blend) {
      throw new NotFoundError('Blend details not found');
    }

    // Get base tea ingredient details
    const baseTea = await prisma.ingredients.findUnique({
      where: { id: blend.baseTeaId },
    });

    if (!baseTea) {
      throw new NotFoundError('Base tea not found');
    }

    // Get add-in ingredient details
    const addIns = blend.addIns as Array<{ ingredientId: string; quantity: number }>;
    const addInIds = addIns.map(a => a.ingredientId);
    const addInIngredients = await prisma.ingredients.findMany({
      where: { id: { in: addInIds } },
    });

    // Map add-ins with their details
    const addInsWithDetails = addIns.map(addIn => {
      const ingredient = addInIngredients.find(i => i.id === addIn.ingredientId);
      return {
        ingredientId: addIn.ingredientId,
        quantity: addIn.quantity,
        name: ingredient?.name || 'Unknown',
        category: ingredient?.category || 'Unknown',
      };
    });

    // Calculate recipe (total weight for size)
    const totalGrams = blend.size * 28; // 1oz ≈ 28g
    const addInsTotal = addIns.reduce((sum, a) => sum + a.quantity, 0);
    const baseTeaQuantity = Math.max(0, totalGrams - addInsTotal);

    return {
      cartItemId: cartItem.id,
      blendId: blend.id,
      productId: cartItem.productId,
      variantId: cartItem.variantId,
      name: blend.name || cartItem.products.name,
      size: blend.size,
      quantity: cartItem.quantity,
      price: cartItem.product_variants?.price || cartItem.products.price,
      baseTea: {
        id: baseTea.id,
        name: baseTea.name,
        category: baseTea.category,
        quantity: baseTeaQuantity,
      },
      addIns: addInsWithDetails,
      recipe: {
        totalGrams,
        baseTeaQuantity,
        addInsTotal,
      },
      createdAt: blend.createdAt,
    };
  }
}

