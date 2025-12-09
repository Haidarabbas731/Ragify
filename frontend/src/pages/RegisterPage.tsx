/**
 * Register Page - Structured Onboarding
 * Full-page form with minimal aesthetic, different from login
 * Fonts: Fira Code (main), IBM Plex Sans (secondary)
 */

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../contexts/DarkModeContext";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

// Password strength validation
const passwordRequirements = {
  minLength: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /\d/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

const checkPasswordStrength = (password: string): number => {
  if (!password) return 0;
  let score = 0;
  if (passwordRequirements.minLength.test(password)) score++;
  if (passwordRequirements.uppercase.test(password)) score++;
  if (passwordRequirements.lowercase.test(password)) score++;
  if (passwordRequirements.number.test(password)) score++;
  if (passwordRequirements.special.test(password)) score++;
  return score;
};

const getStrengthColor = (score: number): string => {
  if (score === 0) return "bg-stone-300 dark:bg-zinc-700";
  if (score <= 2) return "bg-red-500";
  if (score === 3) return "bg-orange-500";
  if (score === 4) return "bg-lime-500";
  return "bg-green-500";
};

const getStrengthLabel = (score: number): string => {
  if (score === 0) return "";
  if (score <= 2) return "Weak";
  if (score === 3) return "Fair";
  if (score === 4) return "Good";
  return "Strong";
};

// Validation schema
const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character",
    ),
  inviteCode: z
    .string()
    .length(17, "Invite code must be in format KB-XXXX-XXXX-XXXX")
    .regex(
      /^KB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
      "Invalid invite code format",
    ),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  // Watch password for strength indicator
  const password = watch("password");
  useEffect(() => {
    if (password) {
      setPasswordStrength(checkPasswordStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  // Auto-format invite code (handles paste, typing, uppercase, and trimming)
  const inviteCode = watch("inviteCode");
  useEffect(() => {
    if (inviteCode) {
      // Remove all non-alphanumeric characters and convert to uppercase
      const cleaned = inviteCode.replace(/[^A-Z0-9]/gi, "").toUpperCase();

      // Trim to max 14 characters (will become 17 with hyphens: KB-XXXX-XXXX-XXXX)
      const trimmed = cleaned.slice(0, 14);

      // Format with hyphens: KB-XXXX-XXXX-XXXX
      let formatted = "";
      if (trimmed.length > 0) {
        formatted = trimmed.slice(0, 2);
        if (trimmed.length > 2) {
          formatted += `-${trimmed.slice(2, 6)}`;
        }
        if (trimmed.length > 6) {
          formatted += `-${trimmed.slice(6, 10)}`;
        }
        if (trimmed.length > 10) {
          formatted += `-${trimmed.slice(10, 14)}`;
        }
      }

      // Only update if the formatted value is different
      if (formatted !== inviteCode) {
        setValue("inviteCode", formatted, { shouldValidate: true });
      }
    }
  }, [inviteCode, setValue]);

  // Handle form submission
  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsSubmitting(true);
      setLoading(true);

      // Call register API
      const response = await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        invite_code: data.inviteCode,
      });

      // Store tokens
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);

      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed. Please try again.";
      toast.error(message);
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Progress Indicator */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden flex-col justify-between p-16">
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          {/* Logo & Brand */}
          <div className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <img src="/ragify.png" alt="Ragify Logo" className="w-24 h-24" />
              <h2 className="text-5xl font-bold font-sans text-card-foreground">
                Ragify
              </h2>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <span
                  className="text-zinc-950 font-bold"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                >
                  01
                </span>
              </div>
              <div className="pt-2">
                <h3
                  className="text-card-foreground font-semibold mb-1"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Create Account
                </h3>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Enter your details to get started
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-40">
              <div className="w-10 h-10 rounded-full border-2 border-card-foreground flex items-center justify-center flex-shrink-0">
                <span
                  className="text-card-foreground font-bold"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                >
                  02
                </span>
              </div>
              <div className="pt-2">
                <h3
                  className="text-card-foreground font-semibold mb-1"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Upload Documents
                </h3>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Upload PDFs, DOCX, TXT, and markdown files to your knowledge
                  base
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-40">
              <div className="w-10 h-10 rounded-full border-2 border-card-foreground flex items-center justify-center flex-shrink-0">
                <span
                  className="text-card-foreground font-bold"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                >
                  03
                </span>
              </div>
              <div className="pt-2">
                <h3
                  className="text-card-foreground font-semibold mb-1"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Start Chatting
                </h3>
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  Use AI-powered chat to explore and query your documents
                  instantly
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Quote */}
        <div className="relative z-10">
          <div className="w-12 h-1 bg-card-foreground mb-4" />
          <p
            className="text-muted-foreground text-sm leading-relaxed"
            style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
          >
            Secure, private, and powerful. Your documents stay yours.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto bg-background relative">
        {/* Back Button */}
        <Link
          to="/"
          className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back to home</span>
        </Link>

        <div className="w-full max-w-lg">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8">
            <div className="flex items-center gap-2 mb-4">
              <img src="/ragify.png" alt="Ragify Logo" className="w-16 h-16" />
              <h2 className="text-3xl font-bold text-foreground font-sans">
                Ragify
              </h2>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-10">
            <h2
              className="text-4xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              Create Account
            </h2>
            <p
              className="text-muted-foreground"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Fill in your details to get started
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-xs uppercase tracking-widest text-foreground font-semibold"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                Email
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                autoComplete="email"
                placeholder="your@email.com"
                className="h-12 border-2 border-zinc-300 dark:border-zinc-700 focus:border-zinc-950 dark:focus:border-white focus:ring-0 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 transition-colors"
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

            {/* Password Field with Strength Indicator */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-xs uppercase tracking-widest text-foreground font-semibold"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-12 border-2 border-zinc-300 dark:border-zinc-700 focus:border-zinc-950 dark:focus:border-white focus:ring-0 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 pr-12 transition-colors"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-500 hover:text-zinc-950 dark:hover:text-white transition-colors"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-2 mt-3">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: Static array that never reorders
                        key={i}
                        className={`h-1 flex-1 transition-all duration-300 ${
                          i < passwordStrength
                            ? getStrengthColor(passwordStrength)
                            : "bg-zinc-200 dark:bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                  {passwordStrength > 0 && (
                    <p
                      className="text-xs text-zinc-600 dark:text-zinc-400"
                      style={{ fontFamily: "'Fira Code', monospace" }}
                    >
                      Strength: {getStrengthLabel(passwordStrength)}
                    </p>
                  )}

                  {/* Password Requirements Checklist */}
                  <div className="space-y-1 mt-2">
                    {[
                      {
                        label: "8+ characters",
                        test: passwordRequirements.minLength,
                      },
                      {
                        label: "Uppercase letter",
                        test: passwordRequirements.uppercase,
                      },
                      {
                        label: "Lowercase letter",
                        test: passwordRequirements.lowercase,
                      },
                      { label: "Number", test: passwordRequirements.number },
                      {
                        label: "Special character",
                        test: passwordRequirements.special,
                      },
                    ].map(({ label, test }) => (
                      <div
                        key={label}
                        className="flex items-center gap-2 text-xs"
                      >
                        {test.test(password) ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <X className="w-3 h-3 text-zinc-400 dark:text-zinc-600" />
                        )}
                        <span
                          className={
                            test.test(password)
                              ? "text-green-600 dark:text-green-400"
                              : "text-zinc-500 dark:text-zinc-500"
                          }
                          style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                        >
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.password && (
                <p
                  className="text-sm text-red-600 dark:text-red-400"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Invite Code Field */}
            <div className="space-y-2">
              <Label
                htmlFor="inviteCode"
                className="text-xs uppercase tracking-widest text-foreground font-semibold"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                Invite Code
              </Label>
              <Input
                {...register("inviteCode")}
                id="inviteCode"
                type="text"
                placeholder="KB-XXXX-XXXX-XXXX"
                maxLength={17}
                className="h-12 border-2 border-zinc-300 dark:border-zinc-700 focus:border-zinc-950 dark:focus:border-white focus:ring-0 bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 uppercase tracking-widest text-center font-bold transition-colors"
                style={{ fontFamily: "'Fira Code', monospace" }}
                disabled={isSubmitting}
              />
              {errors.inviteCode && (
                <p
                  className="text-sm text-red-600 dark:text-red-400"
                  style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
                >
                  {errors.inviteCode.message}
                </p>
              )}
              <p
                className="text-xs text-zinc-500 dark:text-zinc-500"
                style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
              >
                Don't have a code?{" "}
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Contact your administrator for an invite code")
                  }
                  className="text-zinc-950 dark:text-white underline hover:no-underline"
                >
                  Request access
                </button>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-zinc-950 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-semibold transition-all duration-300 hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 mt-8 group"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <p
              className="text-zinc-600 dark:text-zinc-400 text-center"
              style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
            >
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-zinc-950 dark:text-white font-semibold underline underline-offset-4 hover:no-underline transition-all"
              >
                Sign in
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
