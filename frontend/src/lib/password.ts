import { z } from "zod";

/** The backend's password rules (`validate_password_strength`), in the order they are shown. */
export const PASSWORD_REQUIREMENTS = [
  {
    label: "At least 8 characters",
    message: "Password must be at least 8 characters",
    test: (password: string) => password.length >= 8,
  },
  {
    label: "One uppercase letter",
    message: "Password must contain at least one uppercase letter",
    test: (password: string) => /[A-Z]/.test(password),
  },
  {
    label: "One number",
    message: "Password must contain at least one number",
    test: (password: string) => /\d/.test(password),
  },
  {
    label: "One special character",
    message: "Password must contain at least one special character",
    test: (password: string) => /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/.test(password),
  },
] as const;

export const STRENGTH_LABELS = [
  "Very weak",
  "Weak",
  "Medium",
  "Strong",
  "Very strong",
] as const;

/** 0–4: how many rules pass, with the top step reserved for 12+ characters. */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  const met = PASSWORD_REQUIREMENTS.filter((req) => req.test(password)).length;
  if (met === 4) return password.length >= 12 ? 4 : 3;
  return Math.max(met - 1, 0);
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((req) => req.test(password));
}

/** Zod schema that reports the first unmet rule. */
export const passwordSchema = z.string().superRefine((password, ctx) => {
  const failed = PASSWORD_REQUIREMENTS.find((req) => !req.test(password));
  if (failed) ctx.addIssue({ code: "custom", message: failed.message });
});
