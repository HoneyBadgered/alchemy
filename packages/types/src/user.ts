/**
 * User and authentication types
 */

/**
 * User role types
 */
export type UserRole = 'user' | 'admin';

/**
 * User entity
 */
export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: string;
  updatedAt?: string;
  profile?: UserProfile;
}

/**
 * User profile information
 */
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}

/**
 * Authentication response
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}
