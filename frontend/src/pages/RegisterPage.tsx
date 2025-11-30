/**
 * Register Page - Gateway to Knowledge
 * Glass morphism aesthetic with password strength indicator
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Brain, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../hooks/useDarkMode";
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
  if (score === 0) return "bg-transparent";
  if (score <= 2) return "bg-gradient-to-r from-red-500 to-orange-500";
  if (score === 3) return "bg-gradient-to-r from-orange-500 to-yellow-500";
  if (score === 4) return "bg-gradient-to-r from-yellow-500 to-lime-500";
  return "bg-gradient-to-r from-lime-500 to-green-500";
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 p-4">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Register Card */}
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
              Join the Knowledge
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-400 font-['DM_Sans'] font-medium tracking-wide">
              Create your account to get started
            </p>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            {/* Password Field with Strength Indicator */}
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
                  autoComplete="new-password"
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

              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-['DM_Sans']">
                    <span className="text-slate-600 dark:text-slate-400">
                      Password Strength
                    </span>
                    <span
                      className={`font-semibold ${
                        passwordStrength <= 2
                          ? "text-red-500"
                          : passwordStrength === 3
                            ? "text-yellow-500"
                            : passwordStrength === 4
                              ? "text-lime-500"
                              : "text-green-500"
                      }`}
                    >
                      {getStrengthLabel(passwordStrength)}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ease-out ${getStrengthColor(passwordStrength)}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-['DM_Sans'] mt-1">
                    Use 8+ characters with uppercase, lowercase, number & symbol
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Invite Code Field */}
            <div className="space-y-2">
              <Label
                htmlFor="inviteCode"
                className="text-sm text-slate-700 dark:text-slate-300 font-semibold font-['DM_Sans'] tracking-wide uppercase flex items-center gap-2"
              >
                <KeyRound className="h-4 w-4 text-cyan-500" />
                Invite Code
              </Label>
              <Input
                {...register("inviteCode")}
                id="inviteCode"
                type="text"
                placeholder="KB-XXXX-XXXX-XXXX"
                maxLength={17}
                className="h-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-cyan-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 font-['Fira_Code'] tracking-wider uppercase text-center font-semibold"
                disabled={isSubmitting}
              />
              {errors.inviteCode && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.inviteCode.message}
                </p>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 font-['DM_Sans']">
                Don't have a code?{" "}
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Contact your administrator for an invite code")
                  }
                  className="text-cyan-600 dark:text-cyan-400 hover:underline inline"
                >
                  Request access
                </button>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/30 dark:shadow-cyan-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-['DM_Sans'] mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-slate-600 dark:text-slate-400 font-['DM_Sans']">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Decorative floating elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full blur-2xl opacity-20 animate-pulse delay-500" />
      </div>
    </div>
  );
}
