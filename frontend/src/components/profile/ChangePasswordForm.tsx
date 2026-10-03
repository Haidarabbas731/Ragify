import { Loader2 } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import { isPasswordValid } from "@/lib/password";

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  disabled?: boolean;
  error?: string;
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  disabled,
  error,
}: PasswordFieldProps) {
  const id = useId();

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <PasswordInput
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-meta text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/** Change-password form with a live strength meter and requirements list. */
export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allRequirementsMet = isPasswordValid(newPassword);
  const passwordsMatch = newPassword !== "" && newPassword === confirmPassword;
  const mismatch =
    confirmPassword !== "" && !passwordsMatch
      ? "Passwords don't match"
      : undefined;
  const sameAsCurrent =
    newPassword !== "" && newPassword === currentPassword
      ? "Choose a password different from your current one"
      : undefined;
  const canSubmit =
    !isSubmitting &&
    currentPassword !== "" &&
    allRequirementsMet &&
    passwordsMatch &&
    !sameAsCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    try {
      await api.post("/users/me/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed", {
        description: "All sessions were signed out. Log in again to continue.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // The backend revokes every session, so send the user to log in
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error: unknown) {
      toast.error("Couldn't change password", {
        description: getApiErrorMessage(error, "Failed to change password"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      <PasswordField
        label="Current password"
        value={currentPassword}
        onChange={setCurrentPassword}
        autoComplete="current-password"
        disabled={isSubmitting}
      />

      <div className="flex flex-col gap-3">
        <PasswordField
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="new-password"
          disabled={isSubmitting}
          error={sameAsCurrent}
        />

        <PasswordStrength password={newPassword} />
      </div>

      <PasswordField
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        autoComplete="new-password"
        disabled={isSubmitting}
        error={mismatch}
      />

      <p className="text-meta text-muted-foreground">
        Changing your password signs you out on every device.
      </p>

      <div>
        <Button type="submit" disabled={!canSubmit}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Update password
        </Button>
      </div>
    </form>
  );
}
