import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  /** Plain-language line under the top bar title. */
  description?: ReactNode;
  /** Buttons or controls aligned to the right. */
  actions?: ReactNode;
  className?: string;
}

/** Description and actions row at the top of a page; the title lives in the top bar. */
export function PageHeader({
  description,
  actions,
  className,
}: PageHeaderProps) {
  if (!description && !actions) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-body text-muted-foreground">{description}</p>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
