import { Ban, Check, Copy } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type { InviteCode } from "@/types/api";

interface InviteCodesTableProps {
  codes: InviteCode[];
  onRevoke: (code: InviteCode) => void;
}

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked (insecure context); the code stays selectable
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={copy}
      aria-label={copied ? "Copied" : `Copy ${code}`}
    >
      {copied ? <Check className="text-success" /> : <Copy />}
    </Button>
  );
}

/** Invite codes with status, usage and expiry; active codes can be revoked. */
export function InviteCodesTable({ codes, onRevoke }: InviteCodesTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Code</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Used</TableHead>
          <TableHead>Expires</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {codes.map((code) => (
          <TableRow key={code.invite_code_id}>
            <TableCell>
              <div className="flex items-center gap-1">
                <code className="select-all font-mono text-body">
                  {code.code}
                </code>
                <CopyCodeButton code={code.code} />
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge
                status={code.status}
                label={code.status === "active" ? "Active" : undefined}
              />
            </TableCell>
            <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
              {code.current_uses} / {code.max_uses}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(code.expires_at, { fallback: "Never" })}
            </TableCell>
            <TableCell
              className="max-w-56 truncate text-muted-foreground"
              title={code.description ?? undefined}
            >
              {code.description ?? "—"}
            </TableCell>
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {formatDate(code.created_at)}
            </TableCell>
            <TableCell>
              {code.status === "active" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Revoke ${code.code}`}
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onRevoke(code)}
                >
                  <Ban />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
