import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../hooks/useDarkMode";
import api from "../lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useDarkMode();

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      await api.post("/auth/password-reset/request", { email: data.email });
      setEmailSent(true);
    } catch {
      // Show success regardless to prevent email enumeration
      setEmailSent(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Back to home */}
      <Link
        to="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium font-sans"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md bg-card border border-border rounded-2xl p-10"
        style={{
          boxShadow:
            "0 1px 2px rgba(34,38,96,0.04), 0 8px 24px -12px rgba(34,38,96,0.10)",
        }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 mb-10">
          <img src="/images/ragify.png" alt="Ragify" className="w-8 h-8" />
          <span className="text-[15px] font-bold text-foreground font-sans">
            Ragify
          </span>
        </Link>

        {emailSent ? (
          /* ── Success state ── */
          <div>
            <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>

            <h1 className="text-[28px] font-bold text-foreground font-sans mb-2">
              Check your email
            </h1>
            <p className="text-[14px] text-muted-foreground font-sans mb-1">
              We sent a reset link to
            </p>
            <p className="text-[14px] font-semibold text-foreground font-sans mb-8">
              {getValues("email")}
            </p>

            <div className="bg-muted border border-border rounded-xl p-4 mb-8">
              <p className="text-[13px] text-muted-foreground font-sans leading-relaxed">
                Click the link in the email to reset your password. The link
                expires in{" "}
                <span className="font-semibold text-foreground">
                  15 minutes
                </span>
                . Check your spam folder if you don't see it.
              </p>
            </div>

            <Link to="/login">
              <Button className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold font-sans rounded-xl">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>

            <div className="mt-6 text-center">
              <p className="text-[13px] text-muted-foreground font-sans">
                Didn't receive it?{" "}
                <button
                  type="button"
                  onClick={() => setEmailSent(false)}
                  className="text-primary font-semibold hover:underline transition-colors"
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        ) : (
          /* ── Form state ── */
          <div>
            <div className="w-11 h-11 rounded-xl bg-primary/8 flex items-center justify-center mb-6">
              <Mail className="w-5 h-5 text-primary" />
            </div>

            <h1 className="text-[28px] font-bold text-foreground font-sans mb-2">
              Reset password
            </h1>
            <p className="text-[14px] text-muted-foreground font-sans mb-10">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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

              {formError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive font-sans">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium">{formError}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-lg transition-all duration-300 hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 font-sans"
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

            <div className="mt-10 pt-8 border-t border-border text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors font-sans"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
