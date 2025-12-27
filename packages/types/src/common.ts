/**
 * Common shared types across the application
 */

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  perPage?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Filter parameters for queries
 */
export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Stock status types
 */
export interface StockStatus {
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  label: string;
  available: number;
}

/**
 * API Error types
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode: number;
}
