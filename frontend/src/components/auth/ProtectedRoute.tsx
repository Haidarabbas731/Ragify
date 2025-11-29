/**
 * Protected Route Wrapper
 * Ensures user is authenticated before accessing protected pages
 */

import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  // Show loading spinner while initializing auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-['DM_Sans']">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the attempted location for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check admin role if required
  if (requireAdmin && user?.role !== "admin") {
    // Non-admin users are redirected to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated (and admin if required), render children
  return <>{children}</>;
}
