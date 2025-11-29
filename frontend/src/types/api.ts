/**
 * API-related TypeScript type definitions
 */

/**
 * API error response structure from backend
 * The backend returns errors in this format
 */
export interface ApiError {
  detail:
    | string
    | {
        error: string;
        resolution: string;
      };
}

/**
 * Generic API response wrapper
 * Used for consistent response handling
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
}
