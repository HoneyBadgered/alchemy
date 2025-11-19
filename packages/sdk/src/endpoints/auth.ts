/**
 * Authentication Endpoints
 */

import type { HttpClient } from '../client/http';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types';

export class AuthEndpoints {
  constructor(private http: HttpClient) {}

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/register', data);
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/login', data);
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    return this.http.post<AuthResponse>('/auth/refresh', { refreshToken });
  }

  async getMe(): Promise<User> {
    return this.http.get<User>('/me');
  }
}
