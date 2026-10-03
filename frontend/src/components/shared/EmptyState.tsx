import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /** What to do next, in one sentence. */
  description?: ReactNode;
  /** Primary action, usually a Button. */
  action?: ReactNode;
  className?: string;
}

/** Centered message for a list or page that has nothing in it yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-section text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-body text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
