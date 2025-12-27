import type { Product } from './product';
export interface ShippingAddress {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
}
export interface BillingAddress extends ShippingAddress {
}
export interface CustomBlendData {
    baseTeaId?: string;
    addIns?: Array<{
        ingredientId: string;
        quantity: number;
    }>;
}
export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number | string;
    customBlend?: CustomBlendData;
    createdAt?: string;
    product?: {
        id: string;
        name: string;
        description: string;
        price: number;
        imageUrl?: string;
        category?: string;
    };
}
export interface OrderStatusLog {
    id: string;
    fromStatus?: string;
    toStatus: string;
    notes?: string;
    createdAt: string;
}
export interface Order {
    id: string;
    userId: string;
    orderNumber?: string;
    status: string;
    subtotal?: number;
    tax?: number;
    shipping?: number;
    discount?: number;
    total: number;
    totalAmount?: number;
    shippingMethod?: string;
    shippingCost?: number;
    taxAmount?: number;
    discountCode?: string;
    discountAmount?: number;
    customerNotes?: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    items?: OrderItem[];
    order_items?: OrderItem[];
    shipping_address?: ShippingAddress;
    billing_address?: BillingAddress;
    statusLogs?: OrderStatusLog[];
}
export interface OrderWithItems extends Order {
    order_items: OrderItem[];
}
export interface PlaceOrderInput {
    shippingAddress?: ShippingAddress;
    billingAddress?: BillingAddress;
    shippingMethod?: string;
    customerNotes?: string;
    discountCode?: string;
}
export interface OrderListResponse {
    orders: Order[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
export interface CartItemWithProduct {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    createdAt: Date | string;
    updatedAt: Date | string;
    products: Product;
    product?: Product;
}
export interface CartItem {
    id: string;
    cartId: string;
    productId: string;
    quantity: number;
    createdAt: string;
    product: Product;
}
export interface CartWithItems {
    id: string;
    userId?: string | null;
    sessionId?: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    cart_items: CartItemWithProduct[];
    items?: CartItem[];
}
export interface CartResponse {
    id: string;
    userId?: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}
export interface Cart {
    id: string;
    userId?: string;
    sessionId?: string;
    items: CartItem[];
    createdAt: string;
    updatedAt: string;
}
//# sourceMappingURL=order.d.ts.map