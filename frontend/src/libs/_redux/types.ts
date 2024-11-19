export interface User {
    id: number;
    email: string;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
    is_superuser: boolean;
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface AuthResponse {
    access: string;
    refresh: string;
    user: User;
}

export interface ApiError {
  detail?: string;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface RootState {
    auth: AuthState;
}