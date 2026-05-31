import {
  FileText,
  FolderOpen,
  HardDrive,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useRef, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useDocuments } from "../../hooks/useDocuments";
import { useUserStats } from "../../hooks/useUserStats";
import { useAuthStore } from "../../store/authStore";
import { NewSourceDialog } from "../dashboard/NewSourceDialog";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: HardDrive },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Collections", href: "/collections", icon: FolderOpen },
  { label: "Profile", href: "/profile", icon: User },
];

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Overview",
    subtitle: "Your knowledge base at a glance",
  },
  "/documents": {
    title: "Documents",
    subtitle: "All uploaded files and their status",
  },
  "/collections": {
    title: "Collections",
    subtitle: "Organise documents into groups",
  },
  "/profile": { title: "Profile", subtitle: "Manage your account settings" },
};

function ProfileDropdown({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold select-none hover:opacity-90 transition-opacity"
        style={{
          background: "linear-gradient(135deg, #7733ea 0%, #153bf5 100%)",
        }}
      >
        {initials}
      </button>

      {open && (
        <>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss is supplementary to explicit close button */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss is supplementary to explicit close button */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white border border-[rgba(34,38,96,0.08)] shadow-[0_16px_48px_-8px_rgba(34,38,96,0.16)] z-50 overflow-hidden">
            {/* Email */}
            <div className="px-4 py-3 border-b border-[rgba(34,38,96,0.06)]">
              <p className="text-[11px] text-[#717187] font-medium">
                Signed in as
              </p>
              <p className="text-[13px] text-[#222660] font-semibold truncate mt-0.5">
                {user?.email}
              </p>
            </div>

            {/* Actions */}
            <div className="p-1.5">
              <button
                type="button"
                onClick={() => {
                  navigate("/profile");
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#222660] hover:bg-[rgba(0,51,255,0.05)] transition-colors text-left"
              >
                <User className="w-4 h-4 text-[#717187]" />
                Profile settings
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium text-[#cc4f0e] hover:bg-[rgba(204,79,14,0.06)] transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const { refetch: refetchDocuments } = useDocuments({
    page: 1,
    limit: 5,
    sort_by: "uploaded_at",
    order: "desc",
  });
  const { refetch: refetchStats } = useUserStats();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const pageMeta = PAGE_META[location.pathname] ?? {
    title: "Ragify",
    subtitle: "",
  };

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-[220px] shrink-0 flex-col border-r border-border bg-card">
        {/* Logo */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 px-5 h-16 border-b border-border"
        >
          <img
            src="/images/ragify.png"
            alt="Ragify"
            className="h-9 w-9 shrink-0"
          />
          <div>
            <div className="text-[15px] font-bold text-[#222660] leading-none">
              Ragify
            </div>
            <div className="text-[10px] text-[#717187] mt-0.5">
              Knowledge OS
            </div>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = location.pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-150 ${
                  active
                    ? "text-[#7733ea] bg-[rgba(119,51,234,0.08)]"
                    : "text-[#717187] hover:text-[#222660] hover:bg-[rgba(0,51,255,0.05)]"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#7733ea]" />
                )}
              </Link>
            );
          })}
          {user?.role === "admin" && (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-semibold transition-colors duration-150 ${
                location.pathname.startsWith("/admin")
                  ? "text-[#7733ea] bg-[rgba(119,51,234,0.08)]"
                  : "text-[#717187] hover:text-[#222660] hover:bg-[rgba(0,51,255,0.05)]"
              }`}
            >
              <Shield className="h-4 w-4 shrink-0" />
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Storage card */}
        <StorageCard />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 shrink-0 border-b border-border bg-card flex items-center px-6 gap-4">
          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-bold text-[#222660] leading-none">
              {pageMeta.title}
            </h1>
            {pageMeta.subtitle && (
              <p className="text-[12px] text-[#717187] mt-1">
                {pageMeta.subtitle}
              </p>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[#717187] hover:bg-[rgba(0,51,255,0.05)] hover:text-[#222660] dark:hover:text-white transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            {/* New Source button */}
            <button
              type="button"
              onClick={() => setNewSourceOpen(true)}
              className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-white text-[13px] font-semibold shadow-sm hover:opacity-95 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #7733ea 0%, #153bf5 100%)",
              }}
            >
              <Plus className="h-4 w-4" />
              New Source
            </button>

            {/* Profile dropdown */}
            <ProfileDropdown onLogout={handleLogout} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      {/* New Source Dialog */}
      <NewSourceDialog
        open={newSourceOpen}
        onClose={() => setNewSourceOpen(false)}
        onUploadComplete={() => {
          refetchDocuments();
          refetchStats();
        }}
      />
    </div>
  );
}

function StorageCard() {
  const { data: stats } = useUserStats();
  const pct = stats?.storage_percentage ?? 0;
  const used = stats?.storage_used_mb ?? 0;
  const limit = stats?.storage_limit_mb ?? 1024;

  return (
    <div
      className="m-3 p-4 rounded-2xl text-white"
      style={{
        background: "linear-gradient(135deg, #7733ea 0%, #153bf5 100%)",
      }}
    >
      <div className="text-[11px] font-medium opacity-75">Storage</div>
      <div className="text-[14px] font-bold mt-1">
        {used} MB <span className="font-normal opacity-70">/ {limit} MB</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div
          className="h-full bg-white/90 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="mt-1.5 text-[11px] opacity-60">
        {pct.toFixed(1)}% used
      </div>
    </div>
  );
}
