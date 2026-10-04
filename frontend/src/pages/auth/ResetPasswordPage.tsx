import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleCheck,
  Loader2,
  type LucideIcon,
  MailWarning,
  TimerOff,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { FieldError } from "@/components/auth/FieldError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { RecoveryPanel } from "@/components/auth/panels/RecoveryPanel";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { usePasswordResetLink } from "@/hooks/usePasswordResetLink";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { passwordSchema } from "@/lib/password";

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

/** The server's answer when a token was used or has expired between the link check and the submit. */
const EXPIRED_DETAIL = "Invalid or expired reset token";

/** Which screen the page shows: a reset link has to be checked before it asks for a password. */
type View = "checking" | "failed" | "expired" | "form" | "success";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const link = usePasswordResetLink(token);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [usedUp, setUsedUp] = useState(false);

  let view: View = "form";
  if (updated) view = "success";
  else if (!token || usedUp || link.data?.valid === false) view = "expired";
  else if (link.isError) view = "failed";
  else if (link.isPending) view = "checking";

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const password = watch("password") ?? "";

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) return;
    try {
      setIsSubmitting(true);
      await api.post("/auth/password-reset/confirm", {
        token,
        new_password: data.password,
      });
      setUpdated(true);
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, "");
      if (message === EXPIRED_DETAIL) {
        setUsedUp(true);
      } else {
        toast.error(message || "Password reset failed. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      align="top"
      panel={<RecoveryPanel />}
      title={TITLES[view]}
      description={DESCRIPTIONS[view]}
    >
      {view === "checking" && <FormSkeleton />}

      {view === "failed" && (
        <div className="fade-in-soft flex flex-col gap-5">
          <StateNote icon={MailWarning}>
            We couldn't check this link. Check your connection and try again.
          </StateNote>
          <Button size="lg" onClick={() => link.refetch()}>
            Try again
          </Button>
        </div>
      )}

      {view === "expired" && (
        <div className="fade-in-soft flex flex-col gap-5">
          <StateNote icon={TimerOff}>
            Reset links work for 15 minutes and only once. Request a new one to
            continue.
          </StateNote>
          <Button asChild size="lg">
            <Link to="/forgot-password">Send a new link</Link>
          </Button>
          <p className="text-center text-body text-muted-foreground">
            <Link
              to="/login"
              className="font-medium text-primary underline underline-offset-4"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      )}

      {view === "success" && (
        <div className="fade-in-soft flex flex-col gap-5">
          <StateNote icon={CircleCheck} tone="success">
            Your other devices will be asked to sign in again.
          </StateNote>
          <Button asChild size="lg">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      )}

      {view === "form" && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col">
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                aria-invalid={!!errors.password}
                {...register("password")}
              />
            </div>
            <PasswordStrength password={password} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <PasswordInput
              id="confirmPassword"
              autoComplete="new-password"
              disabled={isSubmitting}
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword ? "confirm-password-error" : undefined
              }
              {...register("confirmPassword")}
            />
            <FieldError
              id="confirm-password-error"
              message={errors.confirmPassword?.message}
            />
          </div>

          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            {isSubmitting ? "Resetting…" : "Reset password"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

const TITLES: Record<View, string> = {
  checking: "Choose a new password",
  failed: "Choose a new password",
  expired: "This link has expired",
  form: "Choose a new password",
  success: "Password updated",
};

const DESCRIPTIONS: Record<View, string> = {
  checking: "Use a password you don't use anywhere else.",
  failed: "Use a password you don't use anywhere else.",
  expired: "It was already used, or it is older than 15 minutes.",
  form: "Use a password you don't use anywhere else.",
  success: "Sign in with your new password.",
};

/** A short message with an icon, in the same quiet box as the forgot password page. */
function StateNote({
  icon: Icon,
  tone = "default",
  children,
}: {
  icon: LucideIcon;
  tone?: "default" | "success";
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${tone === "success" ? "text-success" : "text-primary"}`}
        aria-hidden="true"
      />
      <p className="text-body text-muted-foreground">{children}</p>
    </div>
  );
}

/** Placeholder with the form's shape while the link is checked, so the form does not shift in. */
function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <span className="sr-only">Checking your link…</span>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-24 bg-border" />
        <Skeleton className="h-10 w-full bg-border" />
      </div>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-36 bg-border" />
        <Skeleton className="h-10 w-full bg-border" />
      </div>
      <Skeleton className="h-11 w-full bg-border" />
    </div>
  );
}
