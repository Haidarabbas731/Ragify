import {
  Eye,
  MoreHorizontal,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBytes, formatDate, formatRelative } from "@/lib/format";
import type { AdminUser } from "@/types/api";

interface UsersTableProps {
  users: AdminUser[];
  /** The signed-in admin; their own row has no suspend or delete. */
  currentUserId?: string;
  onView: (user: AdminUser) => void;
  onSuspend: (user: AdminUser) => void;
  onActivate: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

/** Users with role, status, storage and a row menu for account actions. */
export function UsersTable({
  users,
  currentUserId,
  onView,
  onSuspend,
  onActivate,
  onDelete,
}: UsersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>User</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Storage</TableHead>
          <TableHead>Last sign in</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.user_id === currentUserId;
          return (
            <TableRow key={user.user_id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span
                    className="max-w-64 truncate font-medium"
                    title={user.email}
                  >
                    {user.email}
                  </span>
                  {user.role === "admin" && (
                    <Badge variant="info">
                      <ShieldCheck /> Admin
                    </Badge>
                  )}
                  {isSelf && <Badge variant="muted">You</Badge>}
                </div>
              </TableCell>
              <TableCell>
                <StatusBadge
                  status={user.status === "active" ? "active" : "suspended"}
                  label={user.status === "active" ? "Active" : "Suspended"}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                {formatBytes(user.storage_used_bytes)}
                <span className="text-muted-foreground/70">
                  {" "}
                  / {formatBytes(user.storage_limit_bytes)}
                </span>
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatRelative(user.last_login_at, {
                  fallback: "Never",
                  absoluteAfterDays: 7,
                })}
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted-foreground">
                {formatDate(user.created_at)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${user.email}`}
                    >
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => onView(user)}>
                      <Eye /> View details
                    </DropdownMenuItem>
                    {!isSelf && (
                      <>
                        {user.status === "active" ? (
                          <DropdownMenuItem onSelect={() => onSuspend(user)}>
                            <UserX /> Suspend
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onSelect={() => onActivate(user)}>
                            <UserCheck /> Reactivate
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => onDelete(user)}
                        >
                          <Trash2 /> Delete user
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
