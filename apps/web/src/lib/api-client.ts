/**
 * API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Get cookie value by name
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

/**
 * Get CSRF token from cookie
 */
function getCsrfToken(): string | null {
  return getCookie('XSRF-TOKEN');
}

export class ApiError extends Error {
  constructor(public status: number, public message: string, public errors?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add CSRF token to state-changing requests
    const method = options.method?.toUpperCase() || 'GET';
    const requiresCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    
    if (requiresCsrf) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for refresh tokens and CSRF tokens
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));

      // Auto-retry once if backend issued a new CSRF token for guest session
      if (
        response.status === 403 && 
        error.code === 'CSRF_TOKEN_REQUIRED' && 
        retryCount === 0
      ) {
        // Backend set XSRF-TOKEN cookie, retry the request with the new token
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      // Handle other CSRF errors
      if (response.status === 403 && error.code?.startsWith('CSRF_')) {
        throw new ApiError(
          response.status,
          'Security token expired. Please refresh the page.',
          error.errors
        );
      }

      throw new ApiError(response.status, error.message, error.errors);
    }

    return response.json();
  }

  async get<T>(endpoint: string, token?: string, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (customHeaders) Object.assign(headers, customHeaders);
    
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  async post<T>(endpoint: string, data?: unknown, token?: string, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (customHeaders) Object.assign(headers, customHeaders);
    
    return this.request<T>(endpoint, {
      method: 'POST',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, token?: string, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (customHeaders) Object.assign(headers, customHeaders);
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, token?: string, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (customHeaders) Object.assign(headers, customHeaders);
    
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, token?: string, customHeaders?: Record<string, string>): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (customHeaders) Object.assign(headers, customHeaders);
    
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

export const apiClient = new ApiClient();
