/**
 * HTTP Client for The Alchemy Table API
 */

import type { ApiError } from '../types';

export interface HttpClientConfig {
  baseURL: string;
  accessToken?: string;
  onUnauthorized?: () => void;
}

export class HttpClient {
  private baseURL: string;
  private accessToken?: string;
  private onUnauthorized?: () => void;

  constructor(config: HttpClientConfig) {
    this.baseURL = config.baseURL;
    this.accessToken = config.accessToken;
    this.onUnauthorized = config.onUnauthorized;
  }

  setAccessToken(token: string | undefined) {
    this.accessToken = token;
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      params?: Record<string, string>;
    }
  ): Promise<T> {
    const url = new URL(path, this.baseURL);

    // Add query params
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401 && this.onUnauthorized) {
        this.onUnauthorized();
      }

      const error: ApiError = {
        message: response.statusText,
        statusCode: response.status,
      };

      try {
        const errorData = await response.json() as { message?: string; code?: string };
        error.message = errorData.message || error.message;
        error.code = errorData.code;
      } catch {
        // Use default error message
      }

      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', path, { params });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }
}
