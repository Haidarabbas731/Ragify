import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage } from "./pages/LoginPage";
import { useAuthStore } from "./store/authStore";

// Placeholder pages (to be implemented later)

function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Register Page</h1>
        <p className="text-slate-400">Coming soon...</p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="text-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Playfair_Display']">
          Welcome to Dashboard
        </h1>
        <p className="text-slate-700 dark:text-slate-300 mb-6 font-['DM_Sans']">
          Logged in as: <span className="font-semibold">{user?.email}</span>
        </p>
        <p className="text-slate-600 dark:text-slate-400 mb-8 font-['DM_Sans']">
          Dashboard features coming soon...
        </p>
        <button
          type="button"
          onClick={() => logout()}
          className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 hover:scale-105 font-['DM_Sans']"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

function App() {
  // Initialize auth state from localStorage on app load
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <BrowserRouter>
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
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
