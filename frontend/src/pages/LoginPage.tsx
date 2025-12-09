/**
 * Login Page - Minimalist Editorial
 * Bold typography, negative space, purple theme
 * Fonts: Geist (UI)
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  HardDrive,
  Loader2,
  MessageSquare,
  Search,
} from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden">
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 flex flex-col justify-between p-16 text-card-foreground">
          {/* Logo/Brand */}
          <div>
            <div className="flex items-center gap-4 mb-6">
              <img src="/ragify.png" alt="Ragify Logo" className="w-24 h-24" />
              <h1 className="text-5xl font-bold font-sans text-card-foreground">
                Ragify
              </h1>
            </div>
            <p className="text-xl text-muted-foreground font-sans">
              Your AI-Powered Knowledge Hub
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6 py-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <HardDrive className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Smart Document Storage
                </h3>
                <p className="text-sm text-muted-foreground">
                  Securely store and organize all your documents
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  AI-Powered Chat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ask questions and get instant answers from your docs
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Search className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Semantic Search
                </h3>
                <p className="text-sm text-muted-foreground">
                  Find exactly what you need with vector embeddings
                </p>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="max-w-md">
            <p className="text-lg leading-relaxed text-muted-foreground mb-4 font-sans">
              "Information is the currency of the future. Your documents are
              your wealth."
            </p>
            <div className="w-16 h-0.5 bg-primary" />
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to home</span>
        </Link>

        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12">
            <div className="flex items-center gap-2 mb-4">
              <img src="/ragify.png" alt="Ragify Logo" className="w-16 h-16" />
              <h2 className="text-2xl font-bold text-foreground font-sans">
                Ragify
              </h2>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-12">
            <h2 className="text-5xl font-bold text-foreground mb-3 font-sans">
              Sign in
            </h2>
            <p className="text-lg text-muted-foreground font-sans">
              Access your Ragify workspace
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Email Field */}
            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-widest text-foreground font-medium font-sans"
              >
                Email
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="h-14 border-0 border-b-2 border-border rounded-none focus:border-primary focus:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground text-lg transition-colors font-sans"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-destructive font-sans">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-widest text-foreground font-medium font-sans"
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
                  className="h-14 border-0 border-b-2 border-border rounded-none focus:border-primary focus:ring-0 bg-transparent text-foreground placeholder:text-muted-foreground text-lg pr-12 transition-colors font-sans"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
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
                <p className="text-sm text-destructive font-sans">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors font-sans"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg transition-all duration-300 hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 group font-sans"
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
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-muted-foreground text-center font-sans">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary font-medium underline underline-offset-4 hover:no-underline transition-all"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
