import { KeyRound, Plus } from "lucide-react";
import { useState } from "react";
import { InviteCodeDialog } from "@/components/admin/InviteCodeDialog";
import { InviteCodesTable } from "@/components/admin/InviteCodesTable";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminInviteCodes,
  useCreateInviteCode,
  useRevokeInviteCode,
} from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/errors";
import type { InviteCode } from "@/types/api";

export function AdminInviteCodesPage() {
  const [status, setStatus] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<InviteCode | null>(null);

  const { data: codes = [], isLoading, error, refetch } = useAdminInviteCodes();
  const create = useCreateInviteCode();
  const revoke = useRevokeInviteCode();

  const visible = codes.filter(
    (code) => status === "all" || code.status === status,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        description="Codes that let people create an account while sign-up is invite-only."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New code
          </Button>
        }
      />

      <div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Status" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="fully_used">Used up</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
            <SelectItem value="revoked">Revoked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-48 rounded-2xl" aria-busy="true" />
      ) : error ? (
        <ErrorState
          message={getApiErrorMessage(error, "Couldn't load invite codes.")}
          onRetry={() => refetch()}
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={KeyRound}
          title={
            codes.length === 0 ? "No invite codes yet" : "No matching codes"
          }
          description={
            codes.length === 0
              ? "Create a code to let someone sign up."
              : "Try a different status."
          }
          action={
            codes.length === 0 ? (
              <Button onClick={() => setCreateOpen(true)}>New code</Button>
            ) : undefined
          }
        />
      ) : (
        <InviteCodesTable codes={visible} onRevoke={setRevoking} />
      )}

      <InviteCodeDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        pending={create.isPending}
        onSubmit={(request) =>
          create.mutate(request, { onSuccess: () => setCreateOpen(false) })
        }
      />

      <ConfirmDialog
        open={revoking !== null}
        onOpenChange={(open) => !open && setRevoking(null)}
        tone="destructive"
        title="Revoke this invite code?"
        description={
          revoking
            ? `${revoking.code} stops working right away. People who already signed up with it keep their accounts.`
            : undefined
        }
        confirmLabel="Revoke code"
        pending={revoke.isPending}
        onConfirm={() =>
          revoking &&
          revoke.mutate(revoking.code, { onSuccess: () => setRevoking(null) })
        }
      />
    </div>
  );
}
