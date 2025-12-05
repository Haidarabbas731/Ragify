/**
 * Login Page - Minimalist Editorial
 * Bold typography, negative space, no gradients
 * Fonts: Fira Code (main), IBM Plex Sans (secondary)
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
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

  // Show loading state during auth initialization
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-stone-900 dark:text-zinc-100" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-stone-900 dark:bg-zinc-900 relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-16 text-white">
          {/* Logo/Brand */}
          <div>
            <div className="w-12 h-12 border-4 border-white mb-6" />
            <h1
              className="text-5xl font-bold mb-4 leading-tight"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              Knowledge
              <br />
              Base
            </h1>
          </div>

          {/* Quote */}
          <div className="max-w-md">
            <p
              className="text-lg leading-relaxed text-stone-300 mb-4"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              "Information is the currency of the future. Your documents are
              your wealth."
            </p>
            <div className="w-16 h-0.5 bg-white" />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12">
            <div className="w-10 h-10 border-4 border-stone-900 dark:border-zinc-100 mb-4" />
          </div>

          {/* Heading */}
          <div className="mb-12">
            <h2
              className="text-5xl font-bold text-stone-900 dark:text-zinc-100 mb-3"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              Sign in
            </h2>
            <p
              className="text-lg text-stone-600 dark:text-zinc-400"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Access your knowledge base
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Email Field */}
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-widest text-stone-700 dark:text-zinc-300 font-medium"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Email
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="h-14 border-0 border-b-2 border-stone-300 dark:border-zinc-700 rounded-none focus:border-stone-900 dark:focus:border-zinc-100 focus:ring-0 bg-transparent text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-lg transition-colors"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p
                  className="text-sm text-red-600 dark:text-red-400"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-widest text-stone-700 dark:text-zinc-300 font-medium"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
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
                  className="h-14 border-0 border-b-2 border-stone-300 dark:border-zinc-700 rounded-none focus:border-stone-900 dark:focus:border-zinc-100 focus:ring-0 bg-transparent text-stone-900 dark:text-zinc-100 placeholder:text-stone-400 dark:placeholder:text-zinc-600 text-lg pr-12 transition-colors"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-500 dark:text-zinc-500 hover:text-stone-900 dark:hover:text-zinc-100 transition-colors"
                  disabled={isSubmitting}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  className="text-sm text-red-600 dark:text-red-400"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-zinc-100 underline underline-offset-4 transition-colors"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-stone-900 dark:bg-zinc-100 hover:bg-stone-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-lg transition-all duration-300 hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-12 pt-8 border-t border-stone-200 dark:border-zinc-800">
            <p
              className="text-stone-600 dark:text-zinc-400 text-center"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-stone-900 dark:text-zinc-100 font-medium underline underline-offset-4 hover:no-underline transition-all"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@300..700&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
      `}</style>
    </div>
  );
}
