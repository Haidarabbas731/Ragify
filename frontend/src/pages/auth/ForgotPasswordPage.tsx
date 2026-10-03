import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { FieldError } from "@/components/auth/FieldError";
import { RecoveryPanel } from "@/components/auth/panels/RecoveryPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    try {
      await api.post("/auth/password-reset/request", { email });
    } catch {
      // Same result whether or not the account exists, so emails can't be probed
    }
    setSentTo(email);
  };

  if (sentTo) {
    return (
      <AuthShell
        panel={<RecoveryPanel />}
        title="Check your email"
        description={
          <>
            If an account exists for{" "}
            <span className="font-medium text-foreground">{sentTo}</span>, we
            sent a reset link.
          </>
        }
      >
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
            <MailCheck
              className="mt-0.5 size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <p className="text-body text-muted-foreground">
              The link expires in 15 minutes. Check your spam folder if you
              don't see it.
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/login">Back to sign in</Link>
          </Button>
          <p className="text-center text-body text-muted-foreground">
            Didn't get it?{" "}
            <button
              type="button"
              onClick={() => setSentTo(null)}
              className="font-medium text-primary underline underline-offset-4"
            >
              Try again
            </button>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      panel={<RecoveryPanel />}
      title="Reset your password"
      description="Enter your email and we'll send you a reset link."
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-2 font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      }
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex flex-col gap-5"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error" message={errors.email?.message} />
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}
