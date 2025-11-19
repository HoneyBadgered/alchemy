/**
 * Catalog Endpoints
 */

import type { HttpClient } from '../client/http';
import type { Product, ProductsResponse } from '../types';

export class CatalogEndpoints {
  constructor(private http: HttpClient) {}

  async getProducts(params?: {
    page?: number;
    perPage?: number;
    category?: string;
  }): Promise<ProductsResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = params.page.toString();
    if (params?.perPage) queryParams.perPage = params.perPage.toString();
    if (params?.category) queryParams.category = params.category;

    return this.http.get<ProductsResponse>('/catalog/products', queryParams);
  }

  async getProduct(id: string): Promise<Product> {
    return this.http.get<Product>(`/catalog/products/${id}`);
  }
}
