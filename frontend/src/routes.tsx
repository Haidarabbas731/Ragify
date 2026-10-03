import { lazy, type ReactNode } from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { DocumentStatusProvider } from "@/components/providers/DocumentStatusProvider";
import { useAuthStore } from "@/store/authStore";

// Pages are code-split; `.then` adapts named exports to React.lazy's default export.
const LandingPage = lazy(() =>
  import("@/pages/LandingPage").then((m) => ({ default: m.LandingPage })),
);
const NotFoundPage = lazy(() =>
  import("@/pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("@/pages/auth/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("@/pages/auth/ForgotPasswordPage").then((m) => ({
    default: m.ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@/pages/auth/ResetPasswordPage").then((m) => ({
    default: m.ResetPasswordPage,
  })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const ChatPage = lazy(() =>
  import("@/pages/ChatPage").then((m) => ({ default: m.ChatPage })),
);
const ProfilePage = lazy(() =>
  import("@/pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const CollectionsPage = lazy(() =>
  import("@/pages/CollectionsPage").then((m) => ({
    default: m.CollectionsPage,
  })),
);
const DocumentsPage = lazy(() =>
  import("@/pages/DocumentsPage").then((m) => ({ default: m.DocumentsPage })),
);
const DocumentDetailPage = lazy(() =>
  import("@/pages/DocumentDetailPage").then((m) => ({
    default: m.DocumentDetailPage,
  })),
);
const TestErrorPage = lazy(() =>
  import("@/pages/dev/TestErrorPage").then((m) => ({
    default: m.TestErrorPage,
  })),
);

const AdminSection = lazy(() =>
  import("@/components/admin/AdminSection").then((m) => ({
    default: m.AdminSection,
  })),
);
const AdminOverviewPage = lazy(() =>
  import("@/pages/admin/AdminOverviewPage").then((m) => ({
    default: m.AdminOverviewPage,
  })),
);
const AdminUsersPage = lazy(() =>
  import("@/pages/admin/AdminUsersPage").then((m) => ({
    default: m.AdminUsersPage,
  })),
);
const AdminDocumentsPage = lazy(() =>
  import("@/pages/admin/AdminDocumentsPage").then((m) => ({
    default: m.AdminDocumentsPage,
  })),
);
const AdminInviteCodesPage = lazy(() =>
  import("@/pages/admin/AdminInviteCodesPage").then((m) => ({
    default: m.AdminInviteCodesPage,
  })),
);
const AdminAuditLogsPage = lazy(() =>
  import("@/pages/admin/AdminAuditLogsPage").then((m) => ({
    default: m.AdminAuditLogsPage,
  })),
);

/** Opens old `/chat?conversation=ID` links at `/chat/ID`; otherwise shows the chat page. */
function ChatEntry() {
  const [searchParams] = useSearchParams();
  const legacyId = searchParams.get("conversation");
  return legacyId ? (
    <Navigate to={`/chat/${legacyId}`} replace />
  ) : (
    <ChatPage />
  );
}

/** Sends signed-in users to the dashboard instead of showing a guest-only page. */
function GuestOnly({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

/** The app's route table. */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestOnly>
            <ResetPasswordPage />
          </GuestOnly>
        }
      />
      {/* All other authenticated pages share AppLayout (sidebar + top bar) */}
      <Route
        element={
          <ProtectedRoute>
            <DocumentStatusProvider>
              <AppLayout />
            </DocumentStatusProvider>
          </ProtectedRoute>
        }
      >
        <Route path="/chat/:conversationId?" element={<ChatEntry />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/collections" element={<CollectionsPage />} />
        <Route path="/documents" element={<DocumentsPage />} />
        <Route path="/documents/:documentId" element={<DocumentDetailPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminSection />
            </AdminRoute>
          }
        >
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="invite-codes" element={<AdminInviteCodesPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        </Route>
      </Route>
      {import.meta.env.DEV && (
        <Route path="/test-error" element={<TestErrorPage />} />
      )}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
