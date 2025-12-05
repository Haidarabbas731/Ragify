/**
 * Admin Dashboard - Command Center
 * Professional analytics dashboard with light/dark mode support
 * Light: Clean data dashboard | Dark: Terminal/Command Center aesthetic
 * Backend Integration: Uses useAdminStats() hook for real-time system statistics
 */

import {
  Activity,
  AlertTriangle,
  FileText,
  HardDrive,
  Key,
  Loader2,
  MessageSquare,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminStats } from "@/hooks/useAdmin";

export function AdminDashboard() {
  // Fetch real system stats from backend
  const { data: apiStats, isLoading, error } = useAdminStats();

  // Transform API response to match component expectations
  const stats = apiStats
    ? {
        totalUsers: apiStats.total_users || 0,
        activeUsers: apiStats.active_users || 0,
        totalDocuments: apiStats.total_documents || 0,
        totalConversations: apiStats.total_conversations || 0,
        totalStorageGB: apiStats.total_storage_gb || 0,
      }
    : null;

  // TODO: Recent users will be fetched from /admin/users endpoint with limit=3
  const recentUsers = [
    {
      email: "Loading...",
      role: "user",
      registeredAt: new Date().toISOString(),
    },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Show loading state
  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-cyan-400 mx-auto" />
          <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
            LOADING_SYSTEM_STATS...
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
          <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
          <p className="text-sm text-red-600 dark:text-red-400 font-mono font-bold">
            ERROR_LOADING_STATS
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-400 font-mono">
            {(error as Error).message || "Failed to fetch system statistics"}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 dark:bg-cyan-500 text-white font-mono text-sm rounded hover:bg-blue-700 dark:hover:bg-cyan-600 transition-colors"
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
                ADMIN DASHBOARD
              </h1>
              <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 font-mono">
                System Overview & Monitoring
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/30 rounded text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 dark:bg-green-400 rounded-full animate-pulse" />
                <span>SYSTEM ONLINE</span>
              </div>
              <div className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded text-gray-600 dark:text-slate-400">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="group relative bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:border-blue-300 dark:hover:border-cyan-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/5 dark:from-cyan-500/0 dark:to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-50 dark:bg-cyan-500/10 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Users
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold font-mono tabular-nums text-blue-600 dark:text-cyan-400">
                  {stats.totalUsers}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
                  {stats.activeUsers} active
                </p>
              </div>
            </div>
          </div>

          {/* Total Documents */}
          <div className="group relative bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:border-purple-300 dark:hover:border-blue-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 to-purple-500/5 dark:from-blue-500/0 dark:to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 dark:bg-blue-500/10 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Documents
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold font-mono tabular-nums text-purple-600 dark:text-blue-400">
                  {stats.totalDocuments.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
                  Across all users
                </p>
              </div>
            </div>
          </div>

          {/* Total Conversations */}
          <div className="group relative bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:border-indigo-300 dark:hover:border-purple-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 to-indigo-500/5 dark:from-purple-500/0 dark:to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-indigo-50 dark:bg-purple-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Conversations
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-4xl font-bold font-mono tabular-nums text-indigo-600 dark:text-purple-400">
                  {stats.totalConversations.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
                  Total chat sessions
                </p>
              </div>
            </div>
          </div>

          {/* Storage Used */}
          <div className="group relative bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-6 hover:border-emerald-300 dark:hover:border-emerald-500/50 transition-all duration-300 overflow-hidden shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg">
                  <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-mono text-gray-500 dark:text-slate-500 uppercase tracking-wider">
                  Storage
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                  {stats.totalStorageGB.toFixed(2)}
                  <span className="text-xl text-gray-500 dark:text-slate-500">
                    GB
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-400 font-mono">
                  Total storage used
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-slate-100">
                  RECENT_REGISTRATIONS
                </h2>
                <Activity className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div
                    key={user.email}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded hover:border-blue-300 dark:hover:border-cyan-500/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-900 dark:text-slate-100">
                        {user.email}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-slate-500 font-mono mt-0.5">
                        {formatDate(user.registeredAt)}
                      </p>
                    </div>
                    <div>
                      {user.role === "admin" ? (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 rounded text-xs font-mono text-purple-700 dark:text-purple-400">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded text-xs font-mono text-gray-700 dark:text-slate-400">
                          USER
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/admin/users"
                className="mt-4 block w-full px-4 py-2 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-center text-sm font-mono text-blue-600 dark:text-cyan-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:border-blue-300 dark:hover:border-cyan-500/50 transition-all"
              >
                VIEW_ALL_USERS →
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-mono text-gray-900 dark:text-slate-100">
                  QUICK_ACTIONS
                </h2>
                <TrendingUp className="w-5 h-5 text-gray-400 dark:text-slate-500" />
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-3">
                <Link
                  to="/admin/users"
                  className="group flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded hover:border-blue-300 dark:hover:border-cyan-500/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="p-2 bg-blue-100 dark:bg-cyan-500/10 rounded">
                    <Users className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors">
                      Manage Users
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-500 font-mono">
                      View, suspend, or delete users
                    </p>
                  </div>
                </Link>

                <Link
                  to="/admin/documents"
                  className="group flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded hover:border-purple-300 dark:hover:border-blue-500/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="p-2 bg-purple-100 dark:bg-blue-500/10 rounded">
                    <FileText className="w-5 h-5 text-purple-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-blue-400 transition-colors">
                      Browse Documents
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-500 font-mono">
                      View all user documents
                    </p>
                  </div>
                </Link>

                <Link
                  to="/admin/invite-codes"
                  className="group flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded">
                    <Key className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Invite Codes
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-500 font-mono">
                      Create and manage invite codes
                    </p>
                  </div>
                </Link>

                <Link
                  to="/admin/audit-logs"
                  className="group flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded hover:border-amber-300 dark:hover:border-amber-500/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-all"
                >
                  <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded">
                    <Activity className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono font-semibold text-gray-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Audit Logs
                    </p>
                    <p className="text-xs text-gray-600 dark:text-slate-500 font-mono">
                      View administrative actions
                    </p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
