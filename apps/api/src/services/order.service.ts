/**
 * Order Service
 * Handles order creation and retrieval for customers
 * 
 * INVENTORY LOCKING STRATEGY:
 * - Uses pessimistic locking (SELECT ... FOR UPDATE) to prevent race conditions
 * - Locks product rows during order placement to prevent overselling
 * - Locks ingredient rows for blend products to prevent ingredient overselling
 * - Transaction isolation: ReadCommitted with 15s timeout
 * - Lock acquisition timeout: 5s max wait
 * 
 * BLEND INGREDIENT TRACKING:
 * - When blend products are ordered, ingredient inventory is also decremented
 * - Blends store ingredients in JSON format: { baseTeaId, addIns: [{ingredientId, quantity}] }
 * - Both product stock AND ingredient inventory are validated and locked
 * - Prevents selling blends when ingredient stock is insufficient
 */

import { prisma } from '../utils/prisma';
import crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { 
  BadRequestError, 
  NotFoundError, 
  InsufficientStockError, 
  OrderValidationError 
} from '../utils/errors';

/**
 * Generate a unique order ID in the format: ALC-YYMMDD-XXXX
 * Example: ALC-251221-A3F9
 */
function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate 4 random alphanumeric characters (uppercase)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomPart = '';
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    randomPart += chars[randomIndex];
  }
  
  return `ALC-${year}${month}${day}-${randomPart}`;
}

export interface PlaceOrderInput {
  userId?: string;
  sessionId?: string;
  guestEmail?: string;
  shippingAddress?: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod?: string;
  customerNotes?: string;
  discountCode?: string;
}

export interface OrderListFilters {
  page?: number;
  perPage?: number;
  status?: string;
}

interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    price: number | Prisma.Decimal;
    stock: number;
    isActive: boolean;
  };
}

export class OrderService {
  /**
   * Place an order from the user's or guest's cart
   */
  async placeOrder(input: PlaceOrderInput) {
    const { userId, sessionId, guestEmail, shippingAddress, shippingMethod, customerNotes, discountCode } = input;

    console.log('Creating order:', { userId, sessionId, guestEmail });

    let cart: Awaited<ReturnType<typeof prisma.carts.findFirst>> | null = null;

    try {
      // Get user's cart
      cart = await prisma.carts.findFirst({
        where: userId ? { userId } : { sessionId },
        include: {
          cart_items: {
            include: {
              products: true,
              product_variants: true,
            },
          },
        },
      });

      console.log('Found cart:', cart ? `Cart ${cart.id} with ${cart.cart_items.length} items` : 'No cart found');

      if (!cart || cart.cart_items.length === 0) {
        throw new BadRequestError('Cart is empty');
      }

      // Validate all products are available and have sufficient stock BEFORE transaction
      const stockValidation: Array<{ productName: string; issue: string }> = [];
      for (const item of cart.cart_items) {
        // Check stock from variant if it exists, otherwise from product
        const stock = item.product_variants?.stock ?? item.products.stock;
        const isActive = item.product_variants?.isActive ?? item.products.isActive;
        
        if (!item.products.isActive || !isActive) {
          stockValidation.push({
            productName: item.products.name + (item.product_variants ? ` (${item.product_variants.name})` : ''),
            issue: 'no longer available',
          });
        }
        if (stock < item.quantity) {
          stockValidation.push({
            productName: item.products.name + (item.product_variants ? ` (${item.product_variants.name})` : ''),
            issue: `insufficient stock (requested: ${item.quantity}, available: ${stock})`,
          });
        }
      }

      if (stockValidation.length > 0) {
        throw new InsufficientStockError('Stock validation failed', { issues: stockValidation });
      }

      // Calculate order totals (use variant price if available)
      const subtotal = cart.cart_items.reduce((sum: number, item: CartItemWithProduct) => {
        const price = item.product_variants?.price ?? item.products.price;
        return sum + Number(price) * item.quantity;
      }, 0);

      let shippingCost = 0;
      if (shippingMethod) {
        const shippingMethodData = await prisma.shipping_methods.findUnique({
          where: { name: shippingMethod },
        });
        if (shippingMethodData && shippingMethodData.isActive) {
          shippingCost = Number(shippingMethodData.price);
        }
      }

      // Calculate tax (simplified - could be enhanced with region-based tax)
      let taxAmount = 0;
      const taxRate = await prisma.tax_rates.findFirst({
        where: { 
          region: shippingAddress?.state || 'Global',
          isActive: true,
        },
      });
      if (taxRate) {
        taxAmount = subtotal * Number(taxRate.rate);
      }

      // Apply discount if provided
      let discountAmount = 0;
      let validDiscountCode = null;
      if (discountCode) {
        const discount = await prisma.discount_codes.findUnique({
          where: { code: discountCode },
        });

        if (discount && discount.isActive) {
          const now = new Date();
          const isValid = 
            now >= discount.validFrom && 
            (!discount.validUntil || now <= discount.validUntil) &&
            (!discount.maxUses || discount.usedCount < discount.maxUses) &&
            (!discount.minOrderAmount || subtotal >= Number(discount.minOrderAmount));

          if (isValid) {
            validDiscountCode = discount;
            if (discount.discountType === 'percentage') {
              discountAmount = subtotal * (Number(discount.discountValue) / 100);
            } else {
              discountAmount = Number(discount.discountValue);
            }
          }
        }
      }

      const totalAmount = subtotal + shippingCost + taxAmount - discountAmount;

      // Create order and update inventory in a transaction with proper error handling
      const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // PESSIMISTIC LOCKING: Lock all product rows with FOR UPDATE to prevent race conditions
        // This ensures no other transaction can modify these products until we commit/rollback
        const productIds = cart.cart_items.map((item: CartItemWithProduct) => item.productId);
        
        // Execute raw query to lock rows with FOR UPDATE
        // Prisma doesn't support FOR UPDATE directly, so we use raw SQL
        const lockedProducts = await tx.$queryRaw<Array<{ id: string; stock: number; isActive: boolean }>>`
          SELECT id, stock, "isActive"
          FROM products
          WHERE id IN (${Prisma.join(productIds)})
          FOR UPDATE
        `;

        // Create a map for quick lookup
        const productMap = new Map(lockedProducts.map(p => [p.id, p]));

        // Validate stock levels with locked data
        for (const item of cart.cart_items) {
          const currentProduct = productMap.get(item.productId);

          if (!currentProduct || !currentProduct.isActive) {
            throw new OrderValidationError(`Product ${item.products.name} is no longer available`);
          }

          if (currentProduct.stock < item.quantity) {
            throw new InsufficientStockError(
              `Insufficient stock for ${item.products.name}`,
              { 
                productId: item.productId,
                requested: item.quantity,
                available: currentProduct.stock,
              }
            );
          }
        }

        // INGREDIENT INVENTORY TRACKING FOR BLENDS
        // Identify blend products and extract ingredient requirements
        const blendProducts = cart.cart_items.filter((item: CartItemWithProduct) => 
          item.products.category === 'custom-blend'
        );

        let lockedIngredients: Map<string, { id: string; inventoryAmount: number; name: string }> = new Map();
        const ingredientRequirements: Map<string, number> = new Map();

        if (blendProducts.length > 0) {
          // Fetch blend records to get ingredient composition
          const blendProductIds = blendProducts.map(item => item.productId);
          const blendRecords = await tx.blends.findMany({
            where: { productId: { in: blendProductIds } },
            select: {
              id: true,
              productId: true,
              baseTeaId: true,
              addIns: true,
            },
          });

          // Build a map of productId -> blend record
          const blendMap = new Map(blendRecords.map(b => [b.productId, b]));

          // Calculate total ingredient requirements across all blend items
          for (const item of blendProducts) {
            const blend = blendMap.get(item.productId);
            if (!blend) continue;

            // Add base tea ingredient
            const currentBaseQty = ingredientRequirements.get(blend.baseTeaId) || 0;
            // Each blend uses 1 unit of base tea per quantity ordered
            ingredientRequirements.set(blend.baseTeaId, currentBaseQty + item.quantity);

            // Add add-in ingredients
            const addIns = blend.addIns as Array<{ ingredientId: string; quantity: number }>;
            for (const addIn of addIns) {
              const currentQty = ingredientRequirements.get(addIn.ingredientId) || 0;
              // Multiply add-in quantity by number of blends ordered
              ingredientRequirements.set(addIn.ingredientId, currentQty + (addIn.quantity * item.quantity));
            }
          }

          // Lock ingredient rows with FOR UPDATE if we have ingredient requirements
          if (ingredientRequirements.size > 0) {
            const ingredientIds = Array.from(ingredientRequirements.keys());
            
            const lockedIngredientsArray = await tx.$queryRaw<Array<{ 
              id: string; 
              inventoryAmount: Prisma.Decimal; 
              name: string;
              status: string;
            }>>`
              SELECT id, "inventoryAmount", name, status
              FROM ingredients
              WHERE id IN (${Prisma.join(ingredientIds)})
              FOR UPDATE
            `;

            lockedIngredients = new Map(
              lockedIngredientsArray.map(i => [i.id, { 
                id: i.id, 
                inventoryAmount: Number(i.inventoryAmount),
                name: i.name,
              }])
            );

            // Validate ingredient availability
            for (const [ingredientId, requiredQty] of ingredientRequirements.entries()) {
              const ingredient = lockedIngredients.get(ingredientId);
              
              if (!ingredient) {
                throw new OrderValidationError(`Ingredient with ID ${ingredientId} not found`);
              }

              if (ingredient.inventoryAmount < requiredQty) {
                throw new InsufficientStockError(
                  `Insufficient ingredient inventory for ${ingredient.name}`,
                  { 
                    ingredientId,
                    ingredientName: ingredient.name,
                    requested: requiredQty,
                    available: ingredient.inventoryAmount,
                  }
                );
              }
            }
          }
        }

        // Create order
        const newOrder = await tx.orders.create({
          data: {
            id: generateOrderId(),
            userId: userId || null,
            guestEmail: guestEmail || null,
            sessionId: sessionId || null,
            status: 'pending',
            totalAmount,
            shippingMethod,
            shippingCost,
            taxAmount,
            discountCode: validDiscountCode?.code,
            discountAmount,
            customerNotes,
            updatedAt: new Date(),
            order_items: {
              create: cart.cart_items.map((item: CartItemWithProduct) => {
                const price = item.product_variants?.price ?? item.products.price;
                return {
                  id: crypto.randomUUID(),
                  productId: item.productId,
                  variantId: item.variantId || null,
                  quantity: item.quantity,
                  price,
                };
              }),
            },
          },
          include: {
            order_items: {
              include: {
                products: true,
                product_variants: true,
              },
            },
          },
        });

      console.log('Order created successfully:', newOrder.id);

      // Update product inventory (or variant inventory if variant exists)
      for (const item of cart.cart_items) {
        if (item.variantId) {
          // Update variant stock
          await tx.product_variants.update({
            where: { id: item.variantId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        } else {
          // Update product stock
          await tx.products.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // Update ingredient inventory for blend products
      if (ingredientRequirements.size > 0) {
        for (const [ingredientId, requiredQty] of ingredientRequirements.entries()) {
          await tx.ingredients.update({
            where: { id: ingredientId },
            data: {
              inventoryAmount: {
                decrement: requiredQty,
              },
            },
          });
        }

        console.log('Ingredient inventory updated:', {
          orderId: newOrder.id,
          ingredientsUpdated: ingredientRequirements.size,
          details: Array.from(ingredientRequirements.entries()).map(([id, qty]) => ({
            ingredientId: id,
            ingredientName: lockedIngredients.get(id)?.name,
            quantityDeducted: qty,
          })),
        });
      }

      // Update discount code usage if applicable
      if (validDiscountCode) {
        await tx.discount_codes.update({
          where: { id: validDiscountCode.id },
          data: {
            usedCount: {
              increment: 1,
            },
          },
        });
      }

      // Create initial status log
      await tx.order_status_logs.create({
        data: {
          id: crypto.randomUUID(),
          orderId: newOrder.id,
          fromStatus: null,
          toStatus: 'pending',
          changedBy: userId || null,
          notes: userId ? 'Order placed' : 'Guest order placed',
        },
      });

      // Clear the cart
      await tx.cart_items.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    }, {
      maxWait: 5000, // Max 5 seconds to acquire a connection
      timeout: 15000, // Max 15 seconds for transaction
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
    });

      return order;

    } catch (error) {
      // Log the error for monitoring
      console.error('Order placement failed:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        sessionId,
        cartId: cart?.id,
      });

      // Re-throw known ApiErrors
      if (error instanceof BadRequestError || 
          error instanceof InsufficientStockError || 
          error instanceof OrderValidationError) {
        throw error;
      }

      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2034') {
          throw new OrderValidationError('Transaction conflict - please try again');
        }
        if (error.code === 'P2025') {
          throw new NotFoundError('One or more items no longer exist');
        }
      }

      // Wrap unknown errors
      throw new BadRequestError(
        'Failed to place order. Please try again.',
        { originalError: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }

  /**
   * Get user's order history
   */
  async getOrders(userId: string, filters: OrderListFilters = {}) {
    const { page = 1, perPage = 20, status } = filters;
    const skip = (page - 1) * perPage;

    const where: Prisma.ordersWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { createdAt: 'desc' },
        include: {
          order_items: {
            include: {
              products: true,
            },
          },
        },
      }),
      prisma.orders.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
      },
    };
  }

  /**
   * Get a single order by ID (for the authenticated user)
   */
  async getOrder(orderId: string, userId: string) {
    const order = await prisma.orders.findFirst({
      where: {
        id: orderId,
        userId,
      },
      include: {
        order_items: {
          include: {
            products: true,
          },
        },
        order_status_logs: {
          orderBy: { createdAt: 'desc' },
        },
        users: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    return order;
  }
}
