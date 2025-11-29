/**
 * Reset Password Page - New Beginning
 * Empowering aesthetic with password strength validation
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../hooks/useDarkMode";
import api from "../lib/api";

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
const resetPasswordSchema = z
  .object({
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
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize dark mode from localStorage
  useDarkMode();

  // Redirect if no token
  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token");
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
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

  // Handle form submission
  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      toast.error("Invalid reset token");
      return;
    }

    try {
      setIsSubmitting(true);

      // Call password reset confirm API
      await api.post("/auth/password-reset/confirm", {
        token,
        new_password: data.password,
      });

      toast.success("Password reset successfully!");
      navigate("/login");
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Password reset failed. The link may have expired.";
      toast.error(message);
      console.error("Password reset error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950 dark:via-teal-950 dark:to-cyan-900 p-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Reset Password Card */}
      <div className="relative w-full max-w-md">
        {/* Glass morphism card */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-10">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 dark:from-emerald-500/10 dark:via-teal-500/10 dark:to-cyan-500/10 blur-xl -z-10" />

          {/* Brand Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-emerald-500 to-cyan-600 p-4 rounded-2xl">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400 bg-clip-text text-transparent font-['Playfair_Display'] tracking-tight leading-tight drop-shadow-sm">
              Create New Password
            </h1>
            <p className="text-base text-slate-700 dark:text-slate-300 font-['DM_Sans'] font-medium tracking-wide">
              Choose a strong password to secure your account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Password Field with Strength Indicator */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm text-slate-700 dark:text-slate-300 font-semibold font-['DM_Sans'] tracking-wide uppercase"
              >
                New Password
              </Label>
              <div className="relative">
                <Input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-12 pr-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 font-['DM_Sans']"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
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
                </div>
              )}

              {errors.password && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-sm text-slate-700 dark:text-slate-300 font-semibold font-['DM_Sans'] tracking-wide uppercase"
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  {...register("confirmPassword")}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-12 pr-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-emerald-500 dark:focus:border-emerald-400 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 font-['DM_Sans']"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Requirements Checklist */}
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50 rounded-xl p-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 font-['DM_Sans']">
                Password Requirements:
              </p>
              <div className="space-y-1">
                {[
                  {
                    test: passwordRequirements.minLength,
                    label: "At least 8 characters",
                  },
                  {
                    test: passwordRequirements.uppercase,
                    label: "One uppercase letter",
                  },
                  {
                    test: passwordRequirements.lowercase,
                    label: "One lowercase letter",
                  },
                  { test: passwordRequirements.number, label: "One number" },
                  {
                    test: passwordRequirements.special,
                    label: "One special character",
                  },
                ].map((req) => (
                  <div
                    key={req.label}
                    className="flex items-center gap-2 text-xs font-['DM_Sans']"
                  >
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${
                        password && req.test.test(password)
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    >
                      {password && req.test.test(password) && (
                        <Check className="w-3 h-3" />
                      )}
                    </div>
                    <span
                      className={
                        password && req.test.test(password)
                          ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "text-slate-600 dark:text-slate-400"
                      }
                    >
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 dark:shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-['DM_Sans'] mt-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        </div>

        {/* Decorative floating elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full blur-2xl opacity-20 animate-pulse delay-500" />
      </div>
    </div>
  );
}
