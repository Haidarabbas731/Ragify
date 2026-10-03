import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUserStats } from "@/hooks/useUserStats";
import { useAuthStore } from "@/store/authStore";

/** Avatar button with the account menu: profile settings, storage use and log out. */
export function ProfileMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { data: stats } = useUserStats();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="flex size-9 select-none items-center justify-center rounded-full bg-primary text-meta font-semibold text-primary-foreground transition-[transform,filter] duration-150 ease-snap hover:brightness-110 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {initials}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
          <span className="text-meta text-muted-foreground">Signed in as</span>
          <span className="truncate text-body font-medium">{user?.email}</span>
        </DropdownMenuLabel>
        {stats && (
          <p className="px-2 pb-1.5 text-meta tabular-nums text-muted-foreground">
            Storage {stats.storage_used_mb} MB of {stats.storage_limit_mb} MB
          </p>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/profile")}>
          <User /> Profile settings
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={handleLogout}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
