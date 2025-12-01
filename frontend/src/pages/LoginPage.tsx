/**
 * Login Page - Portal to Knowledge
 * Ethereal Tech Garden aesthetic with glass morphism
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Brain, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useAuthStore } from "../store/authStore";

// Validation schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);

  // Initialize dark mode from localStorage
  useDarkMode();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Handle form submission
  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      navigate("/dashboard");
    } catch (error) {
      // Error is handled by the store (toast notification)
      console.error("Login error:", error);
    }
  };

  // Dev login helper (development only)
  const handleDevLogin = () => {
    // Set fake authentication in localStorage
    const fakeAuthData = {
      user: {
        user_id: "dev-user-123",
        email: "dev@example.com",
        role: "user",
        created_at: new Date().toISOString(),
      },
      token: "dev-fake-token-12345",
    };

    localStorage.setItem(
      "auth-storage",
      JSON.stringify({
        state: {
          user: fakeAuthData.user,
          token: fakeAuthData.token,
          isAuthenticated: true,
        },
        version: 0,
      }),
    );

    // Reload to trigger auth initialization
    window.location.href = "/dashboard";
  };

  // Show loading state during auth initialization
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Glass morphism card */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-10">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 dark:from-cyan-500/10 dark:via-blue-500/10 dark:to-purple-500/10 blur-xl -z-10" />

          {/* Brand Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-4 rounded-2xl">
                <Brain className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Fira_Code'] tracking-tight leading-tight drop-shadow-sm">
              Welcome Back
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 font-['DM_Sans'] font-medium tracking-wide">
              Sign in to access your knowledge base
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm text-slate-700 dark:text-slate-300 font-semibold font-['DM_Sans'] tracking-wide uppercase"
              >
                Email Address
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 font-['DM_Sans']"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm text-slate-700 dark:text-slate-300 font-semibold font-['DM_Sans'] tracking-wide uppercase"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="h-12 pr-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 font-['DM_Sans']"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium transition-colors font-['DM_Sans']"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-['DM_Sans']"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 font-['DM_Sans']">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>

          {/* Dev Login Button (Development Only) */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-slate-300 dark:border-slate-700">
              <Button
                type="button"
                onClick={handleDevLogin}
                variant="outline"
                className="w-full h-10 bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20 border-2 border-orange-400 dark:border-orange-600 hover:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-700 dark:text-orange-400 font-semibold rounded-lg transition-all duration-300 font-['DM_Sans'] text-sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                Dev Login (Skip Authentication)
              </Button>
              <p className="text-xs text-center text-orange-600 dark:text-orange-400 mt-2 font-['DM_Sans']">
                ⚠️ Development mode only - Sets fake auth for testing
              </p>
            </div>
          )}
        </div>

        {/* Decorative floating elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse delay-500" />
      </div>
    </div>
  );
}
