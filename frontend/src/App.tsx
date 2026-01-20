import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./components/auth/AdminRoute";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { DocumentStatusProvider } from "./components/providers/DocumentStatusProvider";
import { DarkModeProvider } from "./contexts/DarkModeContext";
import { useAuthStore } from "./store/authStore";

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Lazy load pages - these will be code-split into separate chunks
// Using .then() to convert named exports to default exports for React.lazy
const LandingPage = lazy(() =>
  import("./pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("./pages/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ChatPage = lazy(() =>
  import("./pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const ProfilePage = lazy(() =>
  import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const CollectionsPage = lazy(() =>
  import("./pages/CollectionsPage").then((m) => ({
    default: m.CollectionsPage,
  })),
);
const DocumentsPage = lazy(() =>
  import("./pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })),
);
const DocumentDetailPage = lazy(() =>
  import("./pages/DocumentDetailPage").then((m) => ({
    default: m.DocumentDetailPage,
  })),
);
const TestErrorPage = lazy(() =>
  import("./pages/TestErrorPage").then((m) => ({ default: m.TestErrorPage })),
);

// Admin pages - lazy loaded
const AdminLayout = lazy(() =>
  import("./components/admin/AdminLayout").then((m) => ({
    default: m.AdminLayout,
  })),
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminUsers = lazy(() =>
  import("./pages/admin/AdminUsers").then((m) => ({ default: m.AdminUsers })),
);
const AdminDocuments = lazy(() =>
  import("./pages/admin/AdminDocuments").then((m) => ({
    default: m.AdminDocuments,
  })),
);
const AdminInviteCodes = lazy(() =>
  import("./pages/admin/AdminInviteCodes").then((m) => ({
    default: m.AdminInviteCodes,
  })),
);
const AdminAuditLogs = lazy(() =>
  import("./pages/admin/AdminAuditLogs").then((m) => ({
    default: m.AdminAuditLogs,
  })),
);

function App() {
  // Initialize auth state from localStorage on app load
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <DarkModeProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <LoginPage />
                )
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <RegisterPage />
                )
              }
            />
            <Route
              path="/forgot-password"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <ForgotPasswordPage />
                )
              }
            />
            <Route
              path="/reset-password"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <ResetPasswordPage />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DocumentStatusProvider>
                    <DashboardPage />
                  </DocumentStatusProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <DocumentStatusProvider>
                    <ChatPage />
                  </DocumentStatusProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <DocumentStatusProvider>
                    <ProfilePage />
                  </DocumentStatusProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <ProtectedRoute>
                  <DocumentStatusProvider>
                    <CollectionsPage />
                  </DocumentStatusProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents"
              element={
                <ProtectedRoute>
                  <DocumentStatusProvider>
                    <DocumentsPage />
                  </DocumentStatusProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/documents/:documentId"
              element={
                <ProtectedRoute>
                  <DocumentStatusProvider>
                    <DocumentDetailPage />
                  </DocumentStatusProvider>
                </ProtectedRoute>
              }
            />
            {/* Test Error Page - FOR TESTING ERROR BOUNDARY ONLY */}
            <Route path="/test-error" element={<TestErrorPage />} />
            {/* Admin Routes - Protected by AdminRoute guard with persistent sidebar */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <DocumentStatusProvider>
                    <AdminLayout />
                  </DocumentStatusProvider>
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="invite-codes" element={<AdminInviteCodes />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </DarkModeProvider>
  );
}

export default App;
