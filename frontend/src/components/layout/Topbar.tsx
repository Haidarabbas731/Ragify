import { Menu, Moon, Plus, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { ProfileMenu } from "./ProfileMenu";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onOpenMenu: () => void;
  onNewSource: () => void;
  onOpenCommandMenu: () => void;
}

/** ⌘ on Apple devices, Ctrl elsewhere, for the shortcut hint. */
const SHORTCUT_HINT =
  typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘K"
    : "Ctrl K";

/** Translucent top bar: page title on the left, theme, New source and account on the right. */
export function Topbar({
  title,
  subtitle,
  onOpenMenu,
  onNewSource,
  onOpenCommandMenu,
}: TopbarProps) {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <header className="material-bar absolute inset-x-0 top-0 z-20 flex h-16 items-center gap-3 border-b border-border px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label="Open menu"
      >
        <Menu />
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-title text-foreground">{title}</h1>
        {subtitle && (
          <p className="mt-0.5 hidden truncate text-meta text-muted-foreground sm:block">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="hidden w-48 justify-start gap-2 font-normal text-muted-foreground md:flex"
          onClick={onOpenCommandMenu}
          aria-label="Open command menu"
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Search />
          Search
          <kbd className="ml-auto rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-meta">
            {SHORTCUT_HINT}
          </kbd>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenCommandMenu}
          aria-label="Open command menu"
        >
          <Search />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label="Toggle dark mode"
        >
          {darkMode ? <Sun /> : <Moon />}
        </Button>
        <Button onClick={onNewSource}>
          <Plus /> <span className="hidden sm:inline">New source</span>
        </Button>
        <ProfileMenu />
      </div>
    </header>
  );
}
