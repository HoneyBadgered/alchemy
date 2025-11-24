/**
 * Cart Service
 * Handles cart operations for both authenticated users and guests
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants for custom blend products
const CUSTOM_BLEND_BASE_PRICE = 12.99;
const CUSTOM_BLEND_ADDIN_PRICE = 1.50;
const CUSTOM_BLEND_STOCK = 999; // Custom blends are always "in stock"

interface AddToCartParams {
  productId: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
}

interface UpdateCartItemParams {
  productId: string;
  quantity: number;
  userId?: string;
  sessionId?: string;
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
      throw new Error('Either userId or sessionId must be provided');
    }

    // Try to find existing cart
    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || null,
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return cart;
  }

  /**
   * Get cart with items
   */
  async getCart({ userId, sessionId }: GetCartParams) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // Calculate cart totals
    const subtotal = cart.items.reduce((sum: number, item: any) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    const itemCount = cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0);

    return {
      cart,
      subtotal,
      itemCount,
    };
  }

  /**
   * Add item to cart
   */
  async addToCart({ productId, quantity, userId, sessionId }: AddToCartParams) {
    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    if (!product.isActive) {
      throw new Error('Product is not available');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;
      
      if (product.stock < newQuantity) {
        throw new Error('Insufficient stock');
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new cart item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
        },
      });
    }

    return this.getCart({ userId, sessionId });
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem({ productId, quantity, userId, sessionId }: UpdateCartItemParams) {
    if (quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    const cartItem = await prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId,
        },
      },
      include: {
        product: true,
      },
    });

    if (!cartItem) {
      throw new Error('Item not found in cart');
    }

    if (cartItem.product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    await prisma.cartItem.update({
      where: { id: cartItem.id },
      data: { quantity },
    });

    return this.getCart({ userId, sessionId });
  }

  /**
   * Remove item from cart
   */
  async removeFromCart({ productId, userId, sessionId }: RemoveFromCartParams) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    await prisma.cartItem.deleteMany({
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

    await prisma.cartItem.deleteMany({
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
    const guestCart = await prisma.cart.findUnique({
      where: { sessionId },
      include: {
        items: true,
      },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return this.getCart({ userId });
    }

    // Get or create user cart
    const userCart = await this.getOrCreateCart(userId);

    // Merge items
    for (const guestItem of guestCart.items) {
      const existingItem = await prisma.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: userCart.id,
            productId: guestItem.productId,
          },
        },
      });

      if (existingItem) {
        // Update quantity
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + guestItem.quantity },
        });
      } else {
        // Move item to user cart
        await prisma.cartItem.update({
          where: { id: guestItem.id },
          data: { cartId: userCart.id },
        });
      }
    }

    // Delete guest cart
    await prisma.cart.delete({
      where: { id: guestCart.id },
    });

    return this.getCart({ userId });
  }

  /**
   * Add custom blend to cart
   * Creates a product for the blend if it doesn't exist, then adds to cart
   */
  async addBlendToCart({
    baseTeaId,
    addIns,
    userId,
    sessionId,
  }: {
    baseTeaId: string;
    addIns: Array<{ ingredientId: string; quantity: number }>;
    userId?: string;
    sessionId?: string;
  }) {
    // Generate a unique product ID based on blend composition
    const blendKey = this.generateBlendKey(baseTeaId, addIns);
    
    // Look for existing blend product with same composition
    let product = await prisma.product.findFirst({
      where: {
        category: 'custom-blend',
        tags: { has: blendKey },
      },
    });

    // If product doesn't exist, create it
    if (!product) {
      // Calculate price based on base tea and add-ins
      const totalPrice = CUSTOM_BLEND_BASE_PRICE + (addIns.length * CUSTOM_BLEND_ADDIN_PRICE);

      // Generate blend name
      const blendName = this.generateBlendName(baseTeaId, addIns);

      product = await prisma.product.create({
        data: {
          name: blendName,
          description: `Custom blend with ${baseTeaId} base and ${addIns.length} add-in${addIns.length === 1 ? '' : 's'}`,
          price: totalPrice,
          category: 'custom-blend',
          tags: [blendKey, 'custom', 'blend'],
          isActive: true,
          stock: CUSTOM_BLEND_STOCK,
        },
      });
    }

    // Add the blend product to cart
    return this.addToCart({
      productId: product.id,
      quantity: 1,
      userId,
      sessionId,
    });
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
  private generateBlendName(baseTeaId: string, addIns: Array<{ ingredientId: string; quantity: number }>): string {
    // Convert IDs to readable names (simple transformation)
    const baseName = baseTeaId.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    const addInCount = addIns.length;
    if (addInCount === 0) {
      return `Custom ${baseName}`;
    }
    return `Custom ${baseName} Blend with ${addInCount} Add-in${addInCount === 1 ? '' : 's'}`;
  }
}
