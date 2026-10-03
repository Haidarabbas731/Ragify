import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthConfig } from "@/hooks/useAuthConfig";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { passwordSchema } from "@/lib/password";
import { useAuthStore } from "@/store/authStore";

const INVITE_CODE_PATTERN = /^KB-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/** Formats typed or pasted text as `KB-XXXX-XXXX-XXXX`. */
function formatInviteCode(value: string): string {
  const cleaned = value
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 14);
  return [
    cleaned.slice(0, 2),
    cleaned.slice(2, 6),
    cleaned.slice(6, 10),
    cleaned.slice(10, 14),
  ]
    .filter(Boolean)
    .join("-");
}

// The invite code is only checked (and only sent) when the server runs in invite-only
// mode, so one server setting controls both sides.
const createRegisterSchema = (inviteOnly: boolean) =>
  z
    .object({
      email: z.string().email("Enter a valid email address"),
      password: passwordSchema,
      inviteCode: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (inviteOnly && !INVITE_CODE_PATTERN.test(data.inviteCode ?? "")) {
        ctx.addIssue({
          code: "custom",
          path: ["inviteCode"],
          message: "Invite codes look like KB-XXXX-XXXX-XXXX",
        });
      }
    });

type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Whether an invite code is needed comes from the server (INVITE_ONLY)
  const { inviteOnly, isLoading: configLoading } = useAuthConfig();
  const registerSchema = useMemo(
    () => createRegisterSchema(inviteOnly),
    [inviteOnly],
  );

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

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

  const password = watch("password") ?? "";
  const inviteCode = watch("inviteCode");

  useEffect(() => {
    if (!inviteCode) return;
    const formatted = formatInviteCode(inviteCode);
    if (formatted !== inviteCode) {
      setValue("inviteCode", formatted, { shouldValidate: true });
    }
  }, [inviteCode, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      setLoading(true);
      const response = await api.post("/auth/register", {
        email: data.email,
        password: data.password,
        invite_code: inviteOnly ? data.inviteCode : undefined,
      });
      localStorage.setItem("access_token", response.data.access_token);
      localStorage.setItem("refresh_token", response.data.refresh_token);
      toast.success("Account created");
      navigate("/dashboard");
    } catch (error: unknown) {
      setFormError(
        getApiErrorMessage(error, "Registration failed. Try again."),
      );
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      description="Start asking questions about your documents."
      footer={
        <>
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary underline underline-offset-4"
          >
            Sign in
          </Link>
        </>
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

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
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

        {inviteOnly && !configLoading && (
          <div className="flex flex-col gap-2">
            <Label htmlFor="inviteCode">Invite code</Label>
            <Input
              id="inviteCode"
              autoComplete="off"
              placeholder="KB-XXXX-XXXX-XXXX"
              disabled={isSubmitting}
              aria-invalid={!!errors.inviteCode}
              aria-describedby={
                errors.inviteCode ? "invite-code-error" : undefined
              }
              className="font-mono uppercase tracking-wider"
              {...register("inviteCode")}
            />
            <FieldError
              id="invite-code-error"
              message={errors.inviteCode?.message}
            />
          </div>
        )}

        <FormError message={formError} />

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting || configLoading}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
