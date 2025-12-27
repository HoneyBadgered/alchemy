import type { StockStatus } from './common';
export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    imageUrl?: string;
    images?: string[];
    category?: string;
    tags?: string[];
    stock: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
    averageRating?: number;
    reviewCount?: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    stockStatus?: StockStatus;
    isOnSale?: boolean;
    discountPercent?: number;
}
export interface Review {
    id: string;
    userId: string;
    productId: string;
    rating: number;
    title?: string;
    content?: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
    user: {
        id: string;
        username: string;
    };
}
export interface ReviewsResponse {
    reviews: Review[];
    ratingDistribution: Record<number, number>;
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
export interface WishlistItem {
    id: string;
    userId: string;
    productId: string;
    createdAt: string;
    product: Product;
}
export interface WishlistResponse {
    items: WishlistItem[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
export interface CouponValidation {
    valid: boolean;
    code?: string;
    description?: string;
    discountType?: 'percentage' | 'fixed_amount';
    discountValue?: number;
    discountAmount?: number;
    minOrderAmount?: number;
    message?: string;
}
export interface RecommendedProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    compareAtPrice?: number;
    imageUrl?: string;
    stock: number;
    averageRating?: number;
    reviewCount: number;
    isOnSale?: boolean;
    discountPercent?: number;
    category?: string;
    tags?: string[];
}
export interface ProductsResponse {
    products: Product[];
    pagination: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}
//# sourceMappingURL=product.d.ts.map