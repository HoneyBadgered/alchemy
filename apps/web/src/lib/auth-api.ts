/**
 * Auth API Service
 */

import { apiClient, ApiError } from './api-client';
import { User } from '@/store/authStore';

export interface RegisterInput {
  email: string;
  password: string;
  username: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface MessageResponse {
  message: string;
}

export class AuthApi {
  async register(input: RegisterInput): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/register', input);
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/login', input);
  }

  async logout(refreshToken: string, accessToken: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>(
      '/auth/logout',
      { refreshToken },
      accessToken
    );
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  }

  async getMe(accessToken: string): Promise<User> {
    return apiClient.get<User>('/auth/me', accessToken);
  }

  async requestPasswordReset(email: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>('/auth/password-reset/request', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>('/auth/password-reset/confirm', {
      token,
      newPassword,
    });
  }

  async verifyEmail(token: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>('/auth/verify-email', { token });
  }

  async resendVerificationEmail(email: string): Promise<MessageResponse> {
    return apiClient.post<MessageResponse>('/auth/resend-verification', { email });
  }
}

export const authApi = new AuthApi();
export { ApiError };
