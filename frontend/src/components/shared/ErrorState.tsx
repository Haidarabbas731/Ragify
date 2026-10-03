import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  /** What went wrong and, if possible, how to fix it. */
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/** Inline failure message for a pane that could not load, with an optional retry. */
export function ErrorState({
  message = "Something went wrong. Try again.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-border bg-card px-6 py-10 text-center",
        className,
      )}
    >
      <AlertCircle className="size-5 text-destructive" />
      <p className="text-body text-foreground">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
