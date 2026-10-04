import { Check, X } from "lucide-react";
import { useRef } from "react";
import {
  getPasswordStrength,
  PASSWORD_REQUIREMENTS,
  STRENGTH_LABELS,
} from "@/lib/password";
import { cn } from "@/lib/utils";

/**
 * Strength bar and requirement checklist for a password being typed. Collapses (height and fade)
 * while the field is empty so the form below glides instead of jumping. It owns its top spacing,
 * so the parent must not add a flex gap.
 */
export function PasswordStrength({ password }: { password: string }) {
  // Keep the last typed value so the panel fades out with its content when the field is cleared.
  const shown = useRef(password);
  if (password) shown.current = password;
  const value = shown.current;
  const empty = !password;
  const strength = getPasswordStrength(value);

  return (
    <div
      className="collapse-rows"
      data-transient
      data-collapsed={empty}
      aria-hidden={empty}
      inert={empty}
    >
      <div>
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4">
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
              const met = req.test(value);
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
      </div>
    </div>
  );
}
