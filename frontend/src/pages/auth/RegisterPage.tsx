import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { AuthShell } from "@/components/auth/AuthShell";
import { FieldError } from "@/components/auth/FieldError";
import { FormError } from "@/components/auth/FormError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { OnboardPanel } from "@/components/auth/panels/OnboardPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { passwordSchema } from "@/lib/password";
import { useAuthStore } from "@/store/authStore";

const registerSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: passwordSchema,
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setLoading } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate("/dashboard", { replace: true });
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
  });

  const password = watch("password") ?? "";

  const onSubmit = async (data: RegisterFormData) => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      setLoading(true);
      await api.post("/auth/register", {
        email: data.email,
        password: data.password,
      });
      navigate(`/verify-email?email=${encodeURIComponent(data.email)}`);
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
      align="top"
      panel={<OnboardPanel />}
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

        <div className="flex flex-col">
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

        <FormError message={formError} />

        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
