export type UserRole = 'user' | 'admin';
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
export interface UserProfile {
    firstName?: string;
    lastName?: string;
    avatarUrl?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    username: string;
}
export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
}
//# sourceMappingURL=user.d.ts.map