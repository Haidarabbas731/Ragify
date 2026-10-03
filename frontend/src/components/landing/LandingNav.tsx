import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "@/components/shared/Wordmark";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Why Ragify", href: "#why-ragify" },
  { label: "FAQ", href: "#faq" },
];

/** Translucent top bar: brand, page anchors, theme and the sign in / create account actions. */
export function LandingNav() {
  const { darkMode, toggleDarkMode } = useDarkMode();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "material-bar fixed inset-x-0 top-0 z-40 border-b transition-[border-color] duration-200 ease-snap",
        scrolled ? "border-border" : "border-transparent",
      )}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-6xl items-center gap-4 px-6">
        <Wordmark />

        <nav
          aria-label="Page sections"
          className="ml-6 hidden items-center gap-1 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 text-body font-medium text-muted-foreground transition-colors duration-150 ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)and(pointer:fine)]:hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>
          {isAuthenticated ? (
            <Button asChild>
              <Link to="/dashboard">Go to dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Create account</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
