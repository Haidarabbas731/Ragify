import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
}

/** Spinner with a label for a pane that is still loading. Prefer Skeleton for known layouts. */
export function LoadingState({
  label = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <output
      className={cn(
        "flex items-center justify-center gap-2 py-12 text-body text-muted-foreground",
        className,
      )}
    >
      <Loader2 className="size-4 animate-spin" />
      {label}
    </output>
  );
}
