import { Check, X } from "lucide-react";
import {
  getPasswordStrength,
  PASSWORD_REQUIREMENTS,
  STRENGTH_LABELS,
} from "@/lib/password";
import { cn } from "@/lib/utils";

/** Strength bar and requirement checklist for a password being typed. Renders nothing when empty. */
export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);

  return (
    <div className="step-in flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4">
      <div className="flex items-center gap-3">
        <div className="flex flex-1 gap-1" aria-hidden="true">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1.5 flex-1 rounded-full bg-border transition-colors duration-200 ease-snap",
                level <= strength &&
                  (strength >= 3
                    ? "bg-success"
                    : strength === 2
                      ? "bg-warning"
                      : "bg-destructive"),
              )}
            />
          ))}
        </div>
        <span className="text-meta font-medium text-foreground">
          {STRENGTH_LABELS[strength]}
        </span>
      </div>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {PASSWORD_REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-2 text-meta transition-colors duration-150 ease-snap",
                met ? "text-success" : "text-muted-foreground",
              )}
            >
              {met ? (
                <Check className="size-3.5" aria-hidden="true" />
              ) : (
                <X className="size-3.5" aria-hidden="true" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
