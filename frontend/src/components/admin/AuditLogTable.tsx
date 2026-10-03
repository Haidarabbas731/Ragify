import { ChevronDown } from "lucide-react";
import { Fragment, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditLogEntry } from "@/types/api";

type BadgeVariant = "destructive" | "success" | "warning" | "info" | "muted";

/** `SUSPEND_USER` → `Suspend user`. */
export function formatActionName(action: string): string {
  const words = action.toLowerCase().split("_").join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function actionVariant(action: string): BadgeVariant {
  const name = action.toUpperCase();
  if (name.startsWith("DELETE") || name.startsWith("SUSPEND")) {
    return "destructive";
  }
  if (name.startsWith("ACTIVATE") || name.startsWith("CREATE"))
    return "success";
  if (name.startsWith("REVOKE")) return "warning";
  return "muted";
}

/** Admin actions with when, what and who; a row expands to show the recorded details. */
export function AuditLogTable({ logs }: { logs: AuditLogEntry[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>When</TableHead>
          <TableHead>Action</TableHead>
          <TableHead>Target</TableHead>
          <TableHead>Admin ID</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Details</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => {
          const open = expanded === log.audit_id;
          return (
            <Fragment key={log.audit_id}>
              <TableRow>
                <TableCell
                  className="whitespace-nowrap text-muted-foreground"
                  title={formatDate(log.timestamp, { withTime: true })}
                >
                  {formatRelative(log.timestamp, { absoluteAfterDays: 7 })}
                </TableCell>
                <TableCell>
                  <Badge variant={actionVariant(log.action)}>
                    {formatActionName(log.action)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">
                    {log.target_type}{" "}
                  </span>
                  <code className="font-mono text-meta">
                    {log.target_id.slice(0, 8)}
                  </code>
                </TableCell>
                <TableCell>
                  <code className="font-mono text-meta text-muted-foreground">
                    {log.admin_user_id.slice(0, 8)}
                  </code>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-expanded={open}
                    aria-label={open ? "Hide details" : "Show details"}
                    onClick={() => setExpanded(open ? null : log.audit_id)}
                  >
                    <ChevronDown
                      className={cn(
                        "transition-transform duration-150 ease-snap",
                        open && "rotate-180",
                      )}
                    />
                  </Button>
                </TableCell>
              </TableRow>
              {open && (
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="py-4">
                    <dl className="grid gap-x-6 gap-y-1 text-meta sm:grid-cols-[auto_1fr]">
                      <dt className="text-muted-foreground">Target ID</dt>
                      <dd className="break-all font-mono">{log.target_id}</dd>
                      <dt className="text-muted-foreground">Admin ID</dt>
                      <dd className="break-all font-mono">
                        {log.admin_user_id}
                      </dd>
                      <dt className="text-muted-foreground">IP address</dt>
                      <dd className="font-mono">{log.ip_address}</dd>
                      <dt className="text-muted-foreground">Recorded at</dt>
                      <dd>{formatDate(log.timestamp, { withTime: true })}</dd>
                    </dl>
                    <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-background p-3 font-mono text-meta text-muted-foreground">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
