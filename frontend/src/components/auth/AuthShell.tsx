import { ArrowLeft, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "@/components/shared/Wordmark";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/contexts/DarkModeContext";

interface AuthShellProps {
  /** What fills the brand panel beside the form (large screens only). */
  panel: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links under the form, e.g. "Don't have an account?". */
  footer?: ReactNode;
}

/** Split layout for sign in, sign up and password reset: brand panel beside a centered form. */
export function AuthShell({
  panel,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex">
        <Wordmark />

        <div className="flex w-full max-w-lg flex-col gap-8">{panel}</div>

        <span aria-hidden="true" />
      </aside>

      <main className="flex min-w-0 flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-ml-3 text-muted-foreground"
          >
            <Link to="/">
              <ArrowLeft /> Back to home
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun /> : <Moon />}
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-10">
          <div className="lg:hidden">
            <Wordmark />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-display text-foreground">{title}</h1>
            {description && (
              <p className="text-body text-muted-foreground">{description}</p>
            )}
          </div>

          {children}

          {footer && (
            <div className="border-t border-border pt-6 text-center text-body text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
