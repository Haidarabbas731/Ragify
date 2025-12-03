import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Admin route guard component.
 *
 * Protects routes that require admin role. Redirects:
 * - Unauthenticated users → /login
 * - Non-admin users → /dashboard
 *
 * @example
 * <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Wait for auth initialization
  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
