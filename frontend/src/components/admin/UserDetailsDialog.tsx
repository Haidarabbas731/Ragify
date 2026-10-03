import { Loader2 } from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminUserDetails } from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/errors";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";

interface UserDetailsDialogProps {
  userId: string | null;
  onClose: () => void;
}

/** One user's account facts plus how much they have stored and created. */
export function UserDetailsDialog({ userId, onClose }: UserDetailsDialogProps) {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useAdminUserDetails(userId ?? undefined);

  const rows: [string, React.ReactNode][] = user
    ? [
        ["Role", user.role === "admin" ? "Admin" : "Member"],
        [
          "Status",
          <StatusBadge
            key="status"
            status={user.status === "active" ? "active" : "suspended"}
            label={user.status === "active" ? "Active" : "Suspended"}
          />,
        ],
        ["Documents", user.document_count.toLocaleString()],
        ["Conversations", user.conversation_count.toLocaleString()],
        ["Collections", user.collection_count.toLocaleString()],
        [
          "Storage",
          `${formatBytes(user.storage_used_bytes)} of ${formatBytes(user.storage_limit_bytes)}`,
        ],
        ["Joined", formatDate(user.created_at, { withTime: true })],
        [
          "Last sign in",
          formatRelative(user.last_login_at, { fallback: "Never" }),
        ],
        [
          "User ID",
          <code key="id" className="font-mono text-meta">
            {user.user_id}
          </code>,
        ],
      ]
    : [];

  return (
    <Dialog open={userId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="break-all">
            {user?.email ?? "User details"}
          </DialogTitle>
          <DialogDescription>Account details and usage.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8" aria-busy="true">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : error || !user ? (
          <ErrorState
            message={getApiErrorMessage(error, "Couldn't load this user.")}
            onRetry={() => refetch()}
          />
        ) : (
          <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-3 text-body">
            {rows.map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-meta text-muted-foreground">{label}</dt>
                <dd className="min-w-0 break-words">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DialogContent>
    </Dialog>
  );
}
