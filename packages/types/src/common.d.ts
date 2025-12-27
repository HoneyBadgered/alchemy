export interface PaginationParams {
    page?: number;
    perPage?: number;
}
export interface PaginationMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}
export interface PaginatedResponse<T> {
    data: T[];
    pagination: PaginationMeta;
}
export interface FilterParams {
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface StockStatus {
    status: 'in_stock' | 'low_stock' | 'out_of_stock';
    label: string;
    available: number;
}
export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
}
//# sourceMappingURL=common.d.ts.map