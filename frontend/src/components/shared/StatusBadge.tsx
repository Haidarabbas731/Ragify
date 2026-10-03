import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Status =
  | "processing"
  | "active"
  | "error"
  | "deleted"
  | "expired"
  | "used"
  | "fully_used"
  | "revoked"
  | "suspended";

const STATUS_CONFIG = {
  processing: {
    label: "Processing",
    variant: "warning",
    icon: <Loader2 className="animate-spin" />,
  },
  active: { label: "Ready", variant: "success", icon: <CheckCircle2 /> },
  error: { label: "Failed", variant: "destructive", icon: <AlertCircle /> },
  deleted: { label: "Deleted", variant: "muted", icon: <Trash2 /> },
  expired: { label: "Expired", variant: "muted", icon: <Clock /> },
  used: { label: "Used", variant: "info", icon: <CheckCircle2 /> },
  fully_used: { label: "Used up", variant: "info", icon: <CheckCircle2 /> },
  revoked: { label: "Revoked", variant: "destructive", icon: <Ban /> },
  suspended: { label: "Suspended", variant: "warning", icon: <Ban /> },
} as const;

interface StatusBadgeProps {
  status: Status;
  /** Overrides the default label. */
  label?: string;
  className?: string;
}

/** Document or invite status as a colored pill with an icon. */
export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={className}>
      {config.icon}
      {label ?? config.label}
    </Badge>
  );
}
