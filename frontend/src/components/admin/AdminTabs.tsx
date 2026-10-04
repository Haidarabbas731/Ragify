import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", to: "/admin", end: true },
  { label: "Users", to: "/admin/users" },
  { label: "Documents", to: "/admin/documents" },
  { label: "Audit log", to: "/admin/audit-logs" },
];

/** Section navigation under the top bar for the admin pages. */
export function AdminTabs() {
  return (
    <nav
      aria-label="Admin sections"
      className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overflow-y-hidden border-b border-border"
    >
      {TABS.map(({ label, to, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "inline-flex h-10 shrink-0 items-center whitespace-nowrap border-b-2 px-3 text-body font-medium transition-[color,border-color] duration-150 ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground [@media(hover:hover)and(pointer:fine)]:hover:text-foreground",
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
