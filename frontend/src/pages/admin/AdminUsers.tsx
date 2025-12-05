/**
 * Admin Users - User Management Command Center
 * Matches AdminDashboard aesthetic: Clean data dashboard (light) | Terminal/Command Center (dark)
 */

import {
  AlertTriangle,
  Eye,
  Filter,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserCheck,
  Users as UsersIcon,
  UserX,
} from "lucide-react";
import { useState } from "react";
import {
  useActivateUser,
  useAdminUsers,
  useDeleteUser,
  useSuspendUser,
} from "../../hooks/useAdmin";

interface User {
  user_id: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "suspended";
  document_count: number;
  storage_used_bytes: number;
  last_login_at: string | null;
  created_at: string;
}

export function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "admin">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "suspended"
  >("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "suspend" | "activate" | "delete";
    user: User;
  } | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch users from backend
  const { data, isLoading, error, refetch } = useAdminUsers({
    page,
    limit,
    status_filter: statusFilter === "all" ? undefined : statusFilter,
    role: roleFilter === "all" ? undefined : roleFilter,
    sort_by: "created_at",
    order: "desc",
  });

  // Get mutations
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();
  const deleteMutation = useDeleteUser();

  const allUsers: User[] = data?.users || [];
  const totalUsers = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Client-side search filtering (only on email)
  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch = user.email
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Format bytes to MB/GB
  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb >= 1000) {
      return `${(mb / 1024).toFixed(2)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  // Action handlers
  const handleSuspend = (user: User) => {
    if (!suspendReason.trim()) {
      return;
    }
    suspendMutation.mutate(
      { userId: user.user_id, reason: suspendReason },
      {
        onSuccess: () => {
          setConfirmDialog(null);
          setSuspendReason("");
        },
      },
    );
  };

  const handleActivate = (user: User) => {
    activateMutation.mutate(user.user_id, {
      onSuccess: () => {
        setConfirmDialog(null);
      },
    });
  };

  const handleDelete = (user: User) => {
    deleteMutation.mutate(user.user_id, {
      onSuccess: () => {
        setConfirmDialog(null);
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-cyan-400" />
        <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
          LOADING_USER_DATA...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-6 px-4">
        <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-red-200 dark:border-red-900/50 rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <Shield className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-slate-100 font-mono mb-2">
            ACCESS_ERROR
          </h2>
          <p className="text-sm text-gray-600 dark:text-slate-400 font-mono mb-6">
            Failed to load user data
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-blue-600 dark:bg-cyan-500 hover:bg-blue-700 dark:hover:bg-cyan-600 text-white font-mono text-sm rounded transition-colors"
          >
            RETRY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold font-mono tracking-tight text-blue-600 dark:text-cyan-400">
                USER_MANAGEMENT
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 font-mono">
                View, suspend, and manage user accounts - {totalUsers} total
                users
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded text-gray-600 dark:text-slate-400">
                <UsersIcon className="w-4 h-4 inline mr-2" />
                PAGE {page} / {totalPages}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Search and Filters */}
        <div className="mb-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Role Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <select
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value as "all" | "user" | "admin")
                }
                className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">ALL ROLES</option>
                <option value="user">USER</option>
                <option value="admin">ADMIN</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "suspended",
                  )
                }
                className="pl-10 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">ALL STATUS</option>
                <option value="active">ACTIVE</option>
                <option value="suspended">SUSPENDED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
              <UsersIcon className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-500 font-mono">
                No users found
              </p>
            </div>
          ) : (
            filteredUsers.map((user, idx) => (
              <div
                key={user.user_id}
                className="group bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:border-blue-300 dark:hover:border-cyan-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
                style={{
                  animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`,
                }}
              >
                <div className="flex items-center justify-between gap-6">
                  {/* Email & Role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="text-lg font-mono font-semibold text-gray-900 dark:text-slate-100 truncate">
                        {user.email}
                      </p>
                      {user.role === "admin" ? (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded text-xs font-mono text-purple-700 dark:text-purple-400">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded text-xs font-mono text-gray-700 dark:text-slate-400">
                          USER
                        </span>
                      )}
                      {user.status === "suspended" && (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded text-xs font-mono text-red-700 dark:text-red-400">
                          SUSPENDED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-600 dark:text-slate-400">
                      <span>Registered {formatDate(user.created_at)}</span>
                      <span>•</span>
                      <span>
                        Last login {formatRelativeTime(user.last_login_at)}
                      </span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-cyan-400">
                        {user.document_count}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 font-mono">
                        DOCS
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold font-mono tabular-nums text-purple-600 dark:text-blue-400">
                        {formatBytes(user.storage_used_bytes)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 font-mono">
                        STORAGE
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="p-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-blue-400 dark:hover:border-cyan-500 transition-all"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                    </button>
                    {user.status === "active" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({ type: "suspend", user })
                        }
                        className="p-2 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/50 transition-all"
                        title="Suspend User"
                      >
                        <UserX className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmDialog({ type: "activate", user })
                        }
                        className="p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all"
                        title="Activate User"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmDialog({ type: "delete", user })}
                      className="p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-400 dark:hover:border-red-500/50 transition-all"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              PREVIOUS
            </button>
            <span className="px-4 py-2 font-mono text-sm text-gray-600 dark:text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NEXT
            </button>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop - click to close is intentional UX pattern
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop requires click handler
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUser(null)}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content - stopPropagation is intentional */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content requires click handler */}
          <div
            className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-lg max-w-2xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-slate-100">
                  USER_DETAILS
                </h2>
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Email
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedUser.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    User ID
                  </p>
                  <p className="font-mono text-sm text-gray-900 dark:text-slate-100 break-all">
                    {selectedUser.user_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Role
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedUser.role.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Status
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedUser.status.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Documents
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {selectedUser.document_count}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Storage Used
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {formatBytes(selectedUser.storage_used_bytes)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Registered
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {formatDate(selectedUser.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-1">
                    Last Login
                  </p>
                  <p className="font-mono text-gray-900 dark:text-slate-100">
                    {formatRelativeTime(selectedUser.last_login_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop - click to close is intentional UX pattern
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop requires click handler
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDialog(null)}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content - stopPropagation is intentional */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content requires click handler */}
          <div
            className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-red-300 dark:border-red-500/50 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h2 className="text-lg font-bold font-mono text-red-700 dark:text-red-400">
                  CONFIRM_ACTION
                </h2>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <p className="font-mono text-gray-900 dark:text-slate-100 mb-4">
                {confirmDialog.type === "delete" && (
                  <>
                    Are you sure you want to delete{" "}
                    <strong className="text-red-600 dark:text-red-400">
                      {confirmDialog.user.email}
                    </strong>
                    ? This action cannot be undone.
                  </>
                )}
                {confirmDialog.type === "suspend" && (
                  <>
                    Are you sure you want to suspend{" "}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {confirmDialog.user.email}
                    </strong>
                    ? They will not be able to log in.
                  </>
                )}
                {confirmDialog.type === "activate" && (
                  <>
                    Activate{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {confirmDialog.user.email}
                    </strong>
                    ? They will be able to log in again.
                  </>
                )}
              </p>
              {confirmDialog.type === "suspend" && (
                <div className="mt-4">
                  <label
                    htmlFor="suspend-reason"
                    className="block text-sm font-mono text-gray-700 dark:text-slate-300 mb-2"
                  >
                    Reason for suspension:
                  </label>
                  <textarea
                    id="suspend-reason"
                    value={suspendReason}
                    onChange={(e) => setSuspendReason(e.target.value)}
                    placeholder="Enter reason (required)..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog(null);
                  setSuspendReason("");
                }}
                disabled={
                  suspendMutation.isPending ||
                  activateMutation.isPending ||
                  deleteMutation.isPending
                }
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.type === "delete") {
                    handleDelete(confirmDialog.user);
                  } else if (confirmDialog.type === "suspend") {
                    handleSuspend(confirmDialog.user);
                  } else {
                    handleActivate(confirmDialog.user);
                  }
                }}
                disabled={
                  (confirmDialog.type === "suspend" && !suspendReason.trim()) ||
                  suspendMutation.isPending ||
                  activateMutation.isPending ||
                  deleteMutation.isPending
                }
                className={`px-4 py-2 border rounded font-mono text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  confirmDialog.type === "delete"
                    ? "bg-red-600 dark:bg-red-500 border-red-700 dark:border-red-600 text-white hover:bg-red-700 dark:hover:bg-red-600"
                    : confirmDialog.type === "suspend"
                      ? "bg-amber-600 dark:bg-amber-500 border-amber-700 dark:border-amber-600 text-white hover:bg-amber-700 dark:hover:bg-amber-600"
                      : "bg-emerald-600 dark:bg-emerald-500 border-emerald-700 dark:border-emerald-600 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600"
                }`}
              >
                {(confirmDialog.type === "delete" &&
                  deleteMutation.isPending) ||
                (confirmDialog.type === "suspend" &&
                  suspendMutation.isPending) ||
                (confirmDialog.type === "activate" &&
                  activateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                {confirmDialog.type === "delete" &&
                  (deleteMutation.isPending ? "DELETING..." : "DELETE")}
                {confirmDialog.type === "suspend" &&
                  (suspendMutation.isPending ? "SUSPENDING..." : "SUSPEND")}
                {confirmDialog.type === "activate" &&
                  (activateMutation.isPending ? "ACTIVATING..." : "ACTIVATE")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
