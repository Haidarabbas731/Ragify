/**
 * Authentication-related TypeScript type definitions
 */

/**
 * User profile information (extracted from JWT or API response)
 */
export interface User {
  user_id: string;
  email: string;
  role: "user" | "admin";
  exp?: number; // JWT expiry timestamp (Unix timestamp)
}

/**
 * Login request payload
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Token response from authentication endpoints
 * (login, refresh)
 */
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  expires_in: number; // Token lifetime in seconds (3600 = 1 hour)
}

/**
 * Zustand auth store state
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean; // True during auth initialization
  error: string | null;
}

/**
 * Zustand auth store actions
 */
export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  initializeAuth: () => void;
  clearAuth: () => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}
