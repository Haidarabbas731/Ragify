/**
 * Admin Invite Codes - Invite Code Management Command Center
 * Matches AdminDashboard aesthetic: Clean data dashboard (light) | Terminal/Command Center (dark)
 */

import {
  AlertTriangle,
  Calendar,
  Check,
  Copy,
  Filter,
  Key,
  Loader2,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  useAdminInviteCodes,
  useCreateInviteCode,
  useRevokeInviteCode,
} from "../../hooks/useAdmin";

interface InviteCode {
  invite_code_id?: string;
  code: string;
  status: "active" | "expired" | "fully_used" | "revoked";
  max_uses: number;
  current_uses: number;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
  description: string | null;
}

export function AdminInviteCodes() {
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "expired" | "fully_used" | "revoked"
  >("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    type: "revoke";
    code: InviteCode;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form state for creating invite codes
  const [formData, setFormData] = useState({
    max_uses: 10,
    expires_at: "",
    description: "",
  });

  // Fetch invite codes from backend
  const {
    data: inviteCodes = [],
    isLoading,
    error,
    refetch,
  } = useAdminInviteCodes();

  // Get mutations
  const createMutation = useCreateInviteCode();
  const revokeMutation = useRevokeInviteCode();

  // Filter codes
  const filteredCodes = inviteCodes.filter(
    (code: InviteCode) => statusFilter === "all" || code.status === statusFilter,
  );

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

  // Copy code to clipboard
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Handle revoke
  const handleRevoke = (code: InviteCode) => {
    if (!code.invite_code_id) return;
    revokeMutation.mutate(code.invite_code_id, {
      onSuccess: () => {
        setConfirmDialog(null);
      },
    });
  };

  // Handle create
  const handleCreate = () => {
    const payload: {
      max_uses: number;
      expires_at?: string;
      description?: string;
    } = {
      max_uses: formData.max_uses,
    };

    if (formData.expires_at) {
      payload.expires_at = new Date(formData.expires_at).toISOString();
    }

    if (formData.description.trim()) {
      payload.description = formData.description.trim();
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setFormData({ max_uses: 10, expires_at: "", description: "" });
      },
    });
  };

  // Get status badge colors
  const getStatusBadge = (status: InviteCode["status"]) => {
    switch (status) {
      case "active":
        return "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
      case "expired":
        return "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400";
      case "fully_used":
        return "bg-gray-100 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600 text-gray-700 dark:text-slate-400";
      case "revoked":
        return "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-purple-600 dark:text-purple-400" />
        <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
          LOADING_INVITE_CODES...
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
            Failed to load invite codes
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-6 py-2.5 bg-purple-600 dark:bg-purple-500 hover:bg-purple-700 dark:hover:bg-purple-600 text-white font-mono text-sm rounded transition-colors"
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
                INVITE_CODES
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 font-mono">
                Create and manage registration invite codes -{" "}
                {inviteCodes.length} total codes
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-cyan-500 border border-blue-700 dark:border-cyan-600 rounded text-white hover:bg-blue-700 dark:hover:bg-cyan-600 transition-colors font-mono text-sm"
            >
              <Plus className="w-4 h-4" />
              CREATE_NEW_CODE
            </button>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Status Filters */}
        <div className="mb-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            <span className="text-sm font-mono text-gray-600 dark:text-slate-400">
              FILTER:
            </span>
            <div className="flex gap-2">
              {(
                ["all", "active", "expired", "fully_used", "revoked"] as const
              ).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded border font-mono text-xs uppercase transition-colors ${statusFilter === status
                      ? "bg-blue-600 dark:bg-cyan-500 border-blue-700 dark:border-cyan-600 text-white"
                      : "bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-cyan-500"
                    }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Invite Codes Table */}
        <div className="space-y-3">
          {filteredCodes.length === 0 ? (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
              <Key className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-500 font-mono">
                No invite codes found
              </p>
            </div>
          ) : (
            filteredCodes.map((code: InviteCode, idx: number) => (
              <div
                key={code.code}
                className="group bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:border-blue-300 dark:hover:border-cyan-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
                style={{
                  animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`,
                }}
              >
                <div className="flex items-start justify-between gap-6">
                  {/* Code & Status */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      {/* Code */}
                      <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded px-3 py-2">
                        <code className="text-lg font-mono font-bold text-blue-600 dark:text-cyan-400">
                          {code.code}
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(code.code)}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                          )}
                        </button>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-1 border rounded text-xs font-mono uppercase ${getStatusBadge(code.status)}`}
                      >
                        {code.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Description */}
                    {code.description && (
                      <p className="text-sm text-gray-600 dark:text-slate-400 font-mono mb-3">
                        {code.description}
                      </p>
                    )}

                    {/* Usage Progress */}
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs font-mono text-gray-600 dark:text-slate-400">
                        <span>
                          {code.current_uses} / {code.max_uses} USES
                        </span>
                        <span>
                          {((code.current_uses / code.max_uses) * 100).toFixed(
                            0,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${code.status === "active"
                              ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                              : code.status === "fully_used"
                                ? "bg-gray-400 dark:bg-slate-600"
                                : code.status === "expired"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }`}
                          style={{
                            width: `${(code.current_uses / code.max_uses) * 100}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-xs font-mono text-gray-600 dark:text-slate-400">
                      <span>Created by {code.created_by}</span>
                      <span>•</span>
                      <span>{formatDate(code.created_at)}</span>
                      {code.expires_at && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Expires {formatDate(code.expires_at)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {code.status === "active" && (
                    <button
                      type="button"
                      onClick={() => setConfirmDialog({ type: "revoke", code })}
                      className="p-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded hover:bg-red-100 dark:hover:bg-red-500/20 hover:border-red-400 dark:hover:border-red-500/50 transition-all"
                      title="Revoke Code"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Invite Code Dialog */}
      {createDialogOpen && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop click-to-close standard UX
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop requires click handler
        <div
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setCreateDialogOpen(false)}
        >
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: Modal content - stopPropagation is intentional */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content requires click handler */}
          <div
            className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border-2 border-gray-300 dark:border-slate-700 rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-mono text-gray-900 dark:text-slate-100">
                  CREATE_INVITE_CODE
                </h2>
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(false)}
                  className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-4">
              {/* Max Uses */}
              <div>
                <label
                  htmlFor="max-uses"
                  className="block text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-2"
                >
                  Max Uses (1-1000)
                </label>
                <input
                  id="max-uses"
                  type="number"
                  min={1}
                  max={1000}
                  value={formData.max_uses}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_uses: Number.parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Expires At */}
              <div>
                <label
                  htmlFor="expires-at"
                  className="block text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-2"
                >
                  Expiration Date (Optional)
                </label>
                <input
                  id="expires-at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-2"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-blue-400 dark:focus:border-cyan-500 transition-colors resize-none"
                  placeholder="e.g., Beta testing program"
                />
              </div>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateDialogOpen(false)}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="px-4 py-2 bg-blue-600 dark:bg-cyan-500 border border-blue-700 dark:border-cyan-600 rounded font-mono text-sm text-white hover:bg-blue-700 dark:hover:bg-cyan-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {createMutation.isPending ? "CREATING..." : "CREATE_CODE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog */}
      {confirmDialog && (
        // biome-ignore lint/a11y/useKeyWithClickEvents: Modal backdrop click-to-close standard UX
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
                  REVOKE_CODE
                </h2>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6">
              <p className="font-mono text-gray-900 dark:text-slate-100 mb-4">
                Are you sure you want to revoke invite code{" "}
                <code className="px-2 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-red-600 dark:text-red-400 font-bold">
                  {confirmDialog.code.code}
                </code>
                ? This action cannot be undone.
              </p>
              <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                Current usage: {confirmDialog.code.current_uses} /{" "}
                {confirmDialog.code.max_uses} uses
              </p>
            </div>

            {/* Dialog Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                disabled={revokeMutation.isPending}
                className="px-4 py-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => handleRevoke(confirmDialog.code)}
                disabled={revokeMutation.isPending}
                className="px-4 py-2 bg-red-600 dark:bg-red-500 border border-red-700 dark:border-red-600 text-white rounded font-mono text-sm hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {revokeMutation.isPending && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {revokeMutation.isPending ? "REVOKING..." : "REVOKE"}
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
