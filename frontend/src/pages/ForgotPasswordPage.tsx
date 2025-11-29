/**
 * Forgot Password Page - Recovery & Renewal
 * Warm, reassuring aesthetic with gentle animations
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail, Sparkles } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../hooks/useDarkMode";
import api from "../lib/api";

// Validation schema
const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Initialize dark mode from localStorage
  useDarkMode();

  // Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  // Handle form submission
  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsSubmitting(true);

      // Call password reset request API
      await api.post("/auth/password-reset/request", {
        email: data.email,
      });

      // Always show success message (prevents email enumeration)
      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (error: unknown) {
      // Even on error, show success message (security best practice)
      setEmailSent(true);
      console.error("Password reset request error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 dark:from-amber-950 dark:via-orange-950 dark:to-pink-900 p-4">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-400/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Success Card */}
        <div className="relative w-full max-w-md">
          <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-10">
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-pink-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-pink-500/10 blur-xl -z-10" />

            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-pink-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-amber-500 to-pink-600 p-4 rounded-2xl">
                  <Mail className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <h1 className="text-3xl md:text-4xl font-black mb-3 bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent font-['Playfair_Display'] tracking-tight leading-tight">
                Check Your Email
              </h1>
              <p className="text-base text-slate-700 dark:text-slate-300 font-['DM_Sans'] font-medium mb-4">
                We've sent password reset instructions to:
              </p>
              <p className="text-lg font-semibold text-amber-600 dark:text-amber-400 font-['DM_Sans']">
                {getValues("email")}
              </p>
            </div>

            {/* Instructions */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-slate-700 dark:text-slate-300 font-['DM_Sans']">
                  <p className="font-semibold mb-2">Next steps:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-1">
                    <li>Check your inbox (and spam folder)</li>
                    <li>Click the reset link in the email</li>
                    <li>The link expires in 15 minutes</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Back to Login */}
            <Link to="/login">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold rounded-xl transition-all duration-300 font-['DM_Sans']"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Login
              </Button>
            </Link>

            {/* Resend Link */}
            <div className="mt-6 text-center">
              <p className="text-slate-600 dark:text-slate-400 font-['DM_Sans'] text-sm">
                Didn't receive the email?{" "}
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-semibold transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>

          {/* Decorative floating elements */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse delay-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-pink-50 dark:from-amber-950 dark:via-orange-950 dark:to-pink-900 p-4">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-pink-400/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Forgot Password Card */}
      <div className="relative w-full max-w-md">
        {/* Glass morphism card */}
        <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-700/50 p-8 md:p-10">
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-pink-500/20 dark:from-amber-500/10 dark:via-orange-500/10 dark:to-pink-500/10 blur-xl -z-10" />

          {/* Brand Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-pink-600 rounded-2xl blur-lg opacity-50 animate-pulse" />
              <div className="relative bg-gradient-to-br from-amber-500 to-pink-600 p-4 rounded-2xl">
                <Mail className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-black mb-3 bg-gradient-to-r from-amber-600 via-orange-600 to-pink-600 dark:from-amber-400 dark:via-orange-400 dark:to-pink-400 bg-clip-text text-transparent font-['Playfair_Display'] tracking-tight leading-tight drop-shadow-sm">
              Reset Password
            </h1>
            <p className="text-base text-slate-700 dark:text-slate-300 font-['DM_Sans'] font-medium tracking-wide">
              No worries, we'll send you reset instructions
            </p>
          </div>

          {/* Form */}
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
                className="h-12 bg-white/50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-300 font-['DM_Sans']"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500 font-['DM_Sans']">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 bg-gradient-to-r from-amber-500 to-pink-600 hover:from-amber-600 hover:to-pink-700 text-white font-semibold rounded-xl shadow-lg shadow-amber-500/30 dark:shadow-amber-500/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-['DM_Sans']"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition-colors font-['DM_Sans']"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </div>
        </div>

        {/* Decorative floating elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full blur-2xl opacity-20 animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse delay-500" />
      </div>
    </div>
  );
}
