import {
  FileText,
  FolderOpen,
  HardDrive,
  LogOut,
  MessageSquare,
  Moon,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { useAuthStore } from "../../store/authStore";
import { Sidebar, SidebarBody, useSidebar } from "../ui/sidebar";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard", icon: HardDrive },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "Chat", href: "/chat", icon: MessageSquare },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Collections", href: "/collections", icon: FolderOpen },
];

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  const { open, animate } = useSidebar();

  return (
    <Link
      to={href}
      className={`relative flex items-center gap-2 py-2 rounded-xl transition-colors duration-150 ${
        active
          ? "bg-[rgba(119,52,231,0.10)] text-[#7734e7] dark:text-[#cd79f5]"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {/* Active left bar */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#7734e7] dark:bg-[#cd79f5]" />
      )}
      {/* Icon container = exact collapsed sidebar width → always centered */}
      <span className="w-[60px] h-9 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5" />
      </span>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-sm font-semibold whitespace-pre !p-0 !m-0"
      >
        {label}
      </motion.span>
    </Link>
  );
}

function SidebarContent({
  user,
  onLogout,
}: {
  user: { email?: string; role?: string } | null;
  onLogout: () => void;
}) {
  const { open, animate } = useSidebar();
  const location = useLocation();

  return (
    <SidebarBody className="justify-between gap-6 bg-background border-r border-border h-full px-0 py-3">
      <div className="flex flex-col gap-6 overflow-x-hidden overflow-y-auto">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 py-1">
          <span className="w-[60px] h-9 flex items-center justify-center shrink-0">
            <img src="/images/ragify.png" alt="Ragify" className="w-8 h-8" />
          </span>
          <motion.span
            animate={{
              display: animate
                ? open
                  ? "inline-block"
                  : "none"
                : "inline-block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="text-base font-bold text-foreground whitespace-pre"
          >
            Ragify
          </motion.span>
        </Link>

        {/* Nav links */}
        <div className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              active={location.pathname === link.href}
            />
          ))}
          {user?.role === "admin" && (
            <NavItem
              href="/admin"
              icon={Shield}
              label="Admin Panel"
              active={location.pathname.startsWith("/admin")}
            />
          )}
        </div>
      </div>

      {/* Bottom: user + logout */}
      <div className="flex flex-col gap-1 overflow-x-hidden">
        <div className="flex items-center gap-2 py-2">
          <span className="w-[60px] h-9 flex items-center justify-center shrink-0">
            <div className="w-7 h-7 rounded-full bg-[rgba(119,52,231,0.12)] flex items-center justify-center">
              <User className="w-4 h-4 text-[#7734e7] dark:text-[#cd79f5]" />
            </div>
          </span>
          <motion.span
            animate={{
              display: animate
                ? open
                  ? "inline-block"
                  : "none"
                : "inline-block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="text-xs text-muted-foreground font-mono whitespace-pre max-w-[140px] truncate"
          >
            {user?.email}
          </motion.span>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 py-2 rounded-xl text-muted-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors duration-150"
        >
          <span className="w-[60px] h-9 flex items-center justify-center shrink-0">
            <LogOut className="w-5 h-5" />
          </span>
          <motion.span
            animate={{
              display: animate
                ? open
                  ? "inline-block"
                  : "none"
                : "inline-block",
              opacity: animate ? (open ? 1 : 0) : 1,
            }}
            className="text-sm font-semibold whitespace-pre"
          >
            Log out
          </motion.span>
        </button>
      </div>
    </SidebarBody>
  );
}

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Slim top bar — dark mode toggle only */}
      <nav className="shrink-0 border-b border-border bg-background flex items-center justify-end px-4 py-2">
        <button
          type="button"
          onClick={toggleDarkMode}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <Sun className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Moon className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </nav>

      {/* Sidebar + page content via Outlet */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
          <SidebarContent user={user} onLogout={handleLogout} />
        </Sidebar>

        <main className="flex-1 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
