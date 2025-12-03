/**
 * Admin Layout - Command Center Navigation
 * Persistent sidebar navigation with terminal-inspired design
 * Light: Professional sidebar | Dark: Tactical command interface
 */

import {
  Activity,
  FileText,
  Home,
  Key,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const adminNavItems: NavItem[] = [
  {
    to: "/admin",
    label: "Command Center",
    icon: LayoutDashboard,
    description: "System Overview",
  },
  {
    to: "/admin/users",
    label: "User Registry",
    icon: Users,
    description: "Manage Users",
  },
  {
    to: "/admin/documents",
    label: "Data Archive",
    icon: FileText,
    description: "Browse Documents",
  },
  {
    to: "/admin/invite-codes",
    label: "Access Codes",
    icon: Key,
    description: "Invite Management",
  },
  {
    to: "/admin/audit-logs",
    label: "Audit Trail",
    icon: Activity,
    description: "Security Logs",
  },
];

export function AdminLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950">
      {/* Tactical Sidebar */}
      <aside className="w-72 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-sm">
        {/* Sidebar Header */}
        <div className="border-b border-gray-200 dark:border-slate-800 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 dark:from-cyan-500 dark:to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-mono tracking-tight text-blue-900 dark:text-cyan-400">
                ADMIN PANEL
              </h2>
              <p className="text-xs font-mono text-blue-600 dark:text-cyan-500/70 uppercase tracking-wider">
                Control Center
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {adminNavItems.map((item, index) => {
            const Icon = item.icon;
            const active = isActive(item.to);

            return (
              <Link
                key={item.to}
                to={item.to}
                className={`
                  group relative flex items-start gap-3 px-4 py-3 rounded-lg transition-all duration-300
                  ${
                    active
                      ? "bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-cyan-500/20 dark:to-blue-500/20 text-white dark:text-cyan-400 shadow-md dark:shadow-cyan-500/10"
                      : "hover:bg-gray-100 dark:hover:bg-slate-800/50 text-gray-700 dark:text-slate-300"
                  }
                `}
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                {/* Active Indicator */}
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white dark:bg-cyan-400 rounded-r-full" />
                )}

                {/* Icon */}
                <div
                  className={`
                  w-8 h-8 flex items-center justify-center rounded-md transition-all duration-300
                  ${
                    active
                      ? "bg-white/20 dark:bg-cyan-400/10"
                      : "bg-gray-200 dark:bg-slate-800 group-hover:bg-gray-300 dark:group-hover:bg-slate-700"
                  }
                `}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active
                        ? "text-white dark:text-cyan-400"
                        : "text-gray-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400"
                    }`}
                  />
                </div>

                {/* Label & Description */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`
                    text-sm font-bold font-mono tracking-tight
                    ${active ? "text-white dark:text-cyan-400" : "text-gray-900 dark:text-slate-200"}
                  `}
                  >
                    {item.label}
                  </div>
                  <div
                    className={`
                    text-xs font-mono
                    ${
                      active
                        ? "text-white/80 dark:text-cyan-400/70"
                        : "text-gray-500 dark:text-slate-500 group-hover:text-gray-700 dark:group-hover:text-slate-400"
                    }
                  `}
                  >
                    {item.description}
                  </div>
                </div>

                {/* Hover Arrow */}
                {!active && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-cyan-400 rounded-full" />
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="border-t border-gray-200 dark:border-slate-800 p-4 bg-gray-50 dark:bg-slate-900/50">
          <Link
            to="/dashboard"
            className="group flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-cyan-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Home className="w-4 h-4 text-gray-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" />
            <div className="flex-1">
              <div className="text-sm font-mono font-medium text-gray-900 dark:text-slate-200">
                Exit Admin
              </div>
              <div className="text-xs font-mono text-gray-500 dark:text-slate-500">
                Back to Dashboard
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
