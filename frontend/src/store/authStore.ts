/**
 * Zustand auth store with persistence and JWT handling
 */

import { toast } from "sonner";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/api";
import type {
  AuthActions,
  AuthState,
  LoginRequest,
  TokenResponse,
  User,
} from "../types/auth";

/**
 * Decode JWT token to extract user information
 * JWT format: header.payload.signature
 * Payload contains: { sub, email, role, jti, exp, iat }
 */
const decodeJWT = (token: string): User | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const decoded = JSON.parse(atob(payload));

    return {
      user_id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      exp: decoded.exp,
    };
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
};

/**
 * Check if JWT token is expired
 */
const isTokenExpired = (exp: number | undefined): boolean => {
  if (!exp) return true;
  return Date.now() >= exp * 1000; // Convert to milliseconds
};

/**
 * Combined auth state and actions
 */
type AuthStore = AuthState & AuthActions;

/**
 * Zustand auth store
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true, // Start as true, will be set to false after initializeAuth completes
      error: null,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      /**
       * Login with email and password
       */
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const payload: LoginRequest = { email, password };
          const { data } = await api.post<TokenResponse>(
            "/auth/login",
            payload,
          );

          // Store tokens in localStorage
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);

          // Decode access token to get user info
          const user = decodeJWT(data.access_token);

          if (!user) {
            throw new Error("Failed to decode user information");
          }

          // Update state
          set({
            user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          toast.success("Login successful!");
        } catch (error: unknown) {
          const message =
            (error as { response?: { data?: { detail?: string } } })?.response
              ?.data?.detail || "Login failed";
          set({ isLoading: false, error: message });
          toast.error(message);
          throw error;
        }
      },

      /**
       * Logout and revoke tokens
       */
      logout: async () => {
        try {
          set({ isLoading: true });

          // Call backend to revoke tokens
          const accessToken = get().accessToken;
          const refreshToken = get().refreshToken;

          if (accessToken) {
            try {
              await api.post("/auth/logout", {
                refresh_token: refreshToken,
              });
            } catch (error) {
              // Ignore logout API errors (token might already be invalid)
              console.warn("Logout API call failed:", error);
            }
          }

          // Clear localStorage
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");

          // Reset state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          toast.success("Logged out successfully");

          // Redirect to login
          window.location.href = "/login";
        } catch (error: unknown) {
          set({ isLoading: false });
          console.error("Logout error:", error);
        }
      },

      /**
       * Refresh access token using refresh token
       */
      refreshAccessToken: async () => {
        try {
          const refreshToken = get().refreshToken;

          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const { data } = await api.post<TokenResponse>(
            "/auth/refresh",
            {},
            {
              headers: {
                Authorization: `Bearer ${refreshToken}`,
              },
            },
          );

          // Store new tokens
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("refresh_token", data.refresh_token);

          // Decode new access token
          const user = decodeJWT(data.access_token);

          if (!user) {
            throw new Error("Failed to decode user information");
          }

          // Update state
          set({
            user,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            isAuthenticated: true,
          });
        } catch (error: unknown) {
          console.error("Token refresh failed:", error);
          get().clearAuth();
          throw error;
        }
      },

      /**
       * Initialize auth state from localStorage
       * Called on app load
       */
      initializeAuth: () => {
        set({ isLoading: true });

        const accessToken = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token");

        if (!accessToken || !refreshToken) {
          set({ isLoading: false });
          return;
        }

        // Decode access token
        const user = decodeJWT(accessToken);

        if (!user) {
          set({ isLoading: false });
          get().clearAuth();
          return;
        }

        // Check if token is expired
        if (isTokenExpired(user.exp)) {
          // Token expired, try to refresh
          get()
            .refreshAccessToken()
            .catch(() => {
              get().clearAuth();
            })
            .finally(() => {
              set({ isLoading: false });
            });
        } else {
          // Token still valid
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      },

      /**
       * Clear auth state (client-side only)
       */
      clearAuth: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");

        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "auth-storage", // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
