/**
 * Admin Audit Logs - Security Audit Trail Command Center
 * Timeline-style audit log interface with amber/orange security theme
 * Backend Integration: Uses useAdminAuditLogs() hook for real-time audit trail
 */

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Filter,
  Key,
  Loader2,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { useAdminAuditLogs } from "@/hooks/useAdmin";

interface AuditLog {
  log_id: string;
  admin_user_id: string;
  admin_email: string;
  action:
    | "user_suspended"
    | "user_activated"
    | "user_deleted"
    | "invite_code_created"
    | "invite_code_revoked"
    | "document_deleted";
  target_type: "user" | "invite_code" | "document";
  target_id: string;
  // biome-ignore lint/suspicious/noExplicitAny: Dynamic audit log details can contain any JSON structure
  details: Record<string, any>;
  created_at: string;
}

export function AdminAuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch real audit logs from backend
  const { data, isLoading, error } = useAdminAuditLogs({ page, limit });

  // Extract logs and pagination from API response
  const allLogs: AuditLog[] = data?.logs || [];
  const totalLogs = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Client-side filtering (search and action filter)
  const filteredLogs = allLogs.filter((log) => {
    const matchesSearch =
      log.admin_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.target_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.details)
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === "all" || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  // Format timestamp
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get action icon
  const getActionIcon = (action: AuditLog["action"]) => {
    switch (action) {
      case "user_suspended":
        return <UserX className="w-4 h-4" />;
      case "user_activated":
        return <UserCheck className="w-4 h-4" />;
      case "user_deleted":
        return <Trash2 className="w-4 h-4" />;
      case "invite_code_created":
        return <Key className="w-4 h-4" />;
      case "invite_code_revoked":
        return <XCircle className="w-4 h-4" />;
      case "document_deleted":
        return <Trash2 className="w-4 h-4" />;
    }
  };

  // Get action badge
  const getActionBadge = (action: AuditLog["action"]) => {
    switch (action) {
      case "user_suspended":
        return "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400";
      case "user_activated":
        return "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400";
      case "user_deleted":
        return "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400";
      case "invite_code_created":
        return "bg-blue-100 dark:bg-blue-500/20 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400";
      case "invite_code_revoked":
        return "bg-amber-100 dark:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400";
      case "document_deleted":
        return "bg-orange-100 dark:bg-orange-500/20 border-orange-200 dark:border-orange-500/30 text-orange-700 dark:text-orange-400";
    }
  };

  // Format action name
  const formatActionName = (action: string) => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-amber-600 dark:text-amber-400 mx-auto" />
          <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
            LOADING_AUDIT_TRAIL...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <Shield className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
          <p className="text-sm text-red-600 dark:text-red-400 font-mono font-bold">
            ERROR_LOADING_AUDIT_LOGS
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-400 font-mono">
            {(error as Error).message || "Failed to fetch audit logs"}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-600 dark:bg-amber-500 text-white font-mono text-sm rounded hover:bg-amber-700 dark:hover:bg-amber-600 transition-colors"
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
              <h1 className="text-3xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
                AUDIT_LOGS
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 font-mono">
                Security audit trail - {totalLogs} total events
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-mono text-gray-600 dark:text-slate-400">
                PAGE {page} / {totalPages}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Filters */}
        <div className="mb-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search admin email or target ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 z-10" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded font-mono text-sm text-gray-900 dark:text-slate-100 focus:outline-none focus:border-amber-400 dark:focus:border-amber-500 transition-colors appearance-none cursor-pointer"
              >
                <option value="all">ALL ACTIONS</option>
                <option value="user_suspended">USER SUSPENDED</option>
                <option value="user_activated">USER ACTIVATED</option>
                <option value="user_deleted">USER DELETED</option>
                <option value="invite_code_created">INVITE CODE CREATED</option>
                <option value="invite_code_revoked">INVITE CODE REVOKED</option>
                <option value="document_deleted">DOCUMENT DELETED</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {filteredLogs.length === 0 ? (
            <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-12 text-center shadow-sm">
              <Shield className="w-12 h-12 text-gray-300 dark:text-slate-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-slate-500 font-mono">
                No audit logs found
              </p>
            </div>
          ) : (
            filteredLogs.map((log, idx) => (
              <div
                key={log.log_id}
                className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                style={{
                  animation: `slideIn 0.3s ease-out ${idx * 0.05}s both`,
                }}
              >
                {/* Log Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-slate-800">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 border-2 border-amber-400 dark:border-amber-500 rounded-full flex items-center justify-center">
                        {getActionIcon(log.action)}
                      </div>
                    </div>

                    {/* Log Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 border rounded text-xs font-mono uppercase ${getActionBadge(log.action)}`}
                        >
                          {formatActionName(log.action)}
                        </span>
                        <span className="text-xs font-mono text-gray-500 dark:text-slate-500">
                          {log.target_type}:{" "}
                          <code className="text-amber-600 dark:text-amber-400">
                            {log.target_id}
                          </code>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-mono">
                        <span className="text-gray-700 dark:text-slate-300">
                          by {log.admin_email}
                        </span>
                        <span className="text-gray-400 dark:text-slate-600">
                          •
                        </span>
                        <span className="flex items-center gap-1.5 text-gray-500 dark:text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedLog(
                          expandedLog === log.log_id ? null : log.log_id,
                        )
                      }
                      className="p-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all"
                      title="View Details"
                    >
                      {expandedLog === log.log_id ? (
                        <ChevronUp className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedLog === log.log_id && (
                  <div className="p-6 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800">
                    <p className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase mb-3">
                      Details (JSON)
                    </p>
                    <pre className="bg-gray-900 dark:bg-black border border-gray-700 dark:border-slate-700 rounded p-4 text-xs font-mono text-green-400 overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                    <div className="mt-4 grid grid-cols-2 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-gray-500 dark:text-slate-500">
                          Log ID:
                        </span>
                        <span className="ml-2 text-gray-900 dark:text-slate-100">
                          {log.log_id}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-slate-500">
                          Admin ID:
                        </span>
                        <span className="ml-2 text-gray-900 dark:text-slate-100">
                          {log.admin_user_id}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredLogs.length > 0 && (
          <div className="mt-6 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-mono text-gray-600 dark:text-slate-400">
                Showing {(page - 1) * limit + 1}-
                {Math.min(page * limit, filteredLogs.length)} of{" "}
                {filteredLogs.length}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="p-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page * limit >= filteredLogs.length}
                  onClick={() => setPage(page + 1)}
                  className="p-2 bg-gray-200 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded hover:bg-gray-300 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
