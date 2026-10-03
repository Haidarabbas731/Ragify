import { Search, Users } from "lucide-react";
import { useState } from "react";
import { SuspendUserDialog } from "@/components/admin/SuspendUserDialog";
import { UserDetailsDialog } from "@/components/admin/UserDetailsDialog";
import { UsersTable } from "@/components/admin/UsersTable";
import { DocumentPagination } from "@/components/documents/DocumentPagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActivateUser,
  useAdminUsers,
  useDeleteUser,
  useSuspendUser,
} from "@/hooks/useAdmin";
import { getApiErrorMessage } from "@/lib/errors";
import { useAuthStore } from "@/store/authStore";
import type { AdminUser } from "@/types/api";

const PAGE_SIZE = 20;

export function AdminUsersPage() {
  const currentUserId = useAuthStore((state) => state.user?.user_id);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  const { data, isLoading, error, refetch } = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    role: role === "all" ? undefined : role,
    status_filter: status === "all" ? undefined : status,
    sort_by: "created_at",
    order: "desc",
  });
  const suspend = useSuspendUser();
  const activate = useActivateUser();
  const remove = useDeleteUser();

  const query = search.trim().toLowerCase();
  const users = (data?.users ?? []).filter(
    (user) => !query || user.email.toLowerCase().includes(query),
  );

  const resetPage = <T,>(set: (value: T) => void) => {
    return (value: T) => {
      set(value);
      setPage(1);
    };
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        description={
          data
            ? `${data.total} ${data.total === 1 ? "user" : "users"}`
            : "View, suspend and remove accounts."
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emails on this page"
            aria-label="Search users by email"
            className="pl-9"
          />
        </div>
        <Select value={role} onValueChange={resetPage(setRole)}>
          <SelectTrigger aria-label="Role" className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="user">Members</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={resetPage(setStatus)}>
          <SelectTrigger aria-label="Status" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 rounded-2xl" aria-busy="true" />
      ) : error ? (
        <ErrorState
          message={getApiErrorMessage(error, "Couldn't load users.")}
          onRetry={() => refetch()}
        />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users found"
          description="Try a different search or filter."
        />
      ) : (
        <UsersTable
          users={users}
          currentUserId={currentUserId}
          onView={(user) => setViewingId(user.user_id)}
          onSuspend={setSuspending}
          onActivate={(user) => activate.mutate(user.user_id)}
          onDelete={setDeleting}
        />
      )}

      {data && (
        <DocumentPagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <UserDetailsDialog
        userId={viewingId}
        onClose={() => setViewingId(null)}
      />

      <SuspendUserDialog
        email={suspending?.email ?? null}
        pending={suspend.isPending}
        onCancel={() => setSuspending(null)}
        onConfirm={(reason) =>
          suspending &&
          suspend.mutate(
            { userId: suspending.user_id, reason },
            { onSuccess: () => setSuspending(null) },
          )
        }
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete ${deleting.email}?` : "Delete user?"}
        description="The account is disabled and signed out on every device. Their documents and chats are not removed; use the Documents tab to delete those."
        confirmLabel="Delete user"
        pending={remove.isPending}
        onConfirm={() =>
          deleting &&
          remove.mutate(deleting.user_id, {
            onSuccess: () => setDeleting(null),
          })
        }
      />
    </div>
  );
}
