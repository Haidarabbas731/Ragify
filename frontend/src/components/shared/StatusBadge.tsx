import { AlertCircle, Ban, CheckCircle2, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Status = "processing" | "active" | "error" | "deleted" | "suspended";

const STATUS_CONFIG = {
  processing: {
    label: "Processing",
    variant: "warning",
    icon: <Loader2 className="animate-spin" />,
  },
  active: { label: "Ready", variant: "success", icon: <CheckCircle2 /> },
  error: { label: "Failed", variant: "destructive", icon: <AlertCircle /> },
  deleted: { label: "Deleted", variant: "muted", icon: <Trash2 /> },
  suspended: { label: "Suspended", variant: "warning", icon: <Ban /> },
} as const;

interface StatusBadgeProps {
  status: Status;
  /** Overrides the default label. */
  label?: string;
  className?: string;
}

/** Document or account status as a colored pill with an icon. */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.icon}
      {label ?? config.label}
    </Badge>
  );
}
