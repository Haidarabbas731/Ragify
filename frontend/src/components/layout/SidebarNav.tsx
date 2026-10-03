import { FileText, FolderOpen, HardDrive, Shield, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { label: "Dashboard", to: "/dashboard", icon: HardDrive },
  { label: "Documents", to: "/documents", icon: FileText },
  { label: "Collections", to: "/collections", icon: FolderOpen },
  { label: "Profile", to: "/profile", icon: User },
];

interface SidebarNavProps {
  /** Called after a link is chosen, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
}

/** Primary navigation links; Admin only appears for admin users. */
export function SidebarNav({ onNavigate }: SidebarNavProps) {
  const isAdmin = useAuthStore((state) => state.user?.role === "admin");
  const links = isAdmin
    ? [...LINKS, { label: "Admin", to: "/admin", icon: Shield }]
    : LINKS;

  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5 px-3 py-2">
      {links.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-body font-medium transition-colors duration-150 ease-snap [&_svg]:size-4 [&_svg]:shrink-0",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
