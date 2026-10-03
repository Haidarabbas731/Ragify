import { ArrowLeft, Check, Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "@/components/shared/Wordmark";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/contexts/DarkModeContext";

const POINTS = [
  "Every answer cites the passages it came from",
  "Your files stay private to your account",
  "Works with PDF, DOCX, Markdown and text files",
];

interface AuthShellProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links under the form, e.g. "Don't have an account?". */
  footer?: ReactNode;
}

/** Split layout for sign in, sign up and password reset: brand panel beside a centered form. */
export function AuthShell({
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

        <div className="flex max-w-md flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 className="text-display text-foreground">
              Ask your documents anything.
            </h2>
            <p className="text-body text-muted-foreground">
              Upload your files and get answers with the exact passages cited.
            </p>
          </div>

          <figure className="flex flex-col gap-2 rounded-2xl border border-border bg-background p-4 shadow-[var(--ragify-shadow)]">
            <figcaption className="text-meta text-muted-foreground">
              What does the policy say about refunds?
            </figcaption>
            <p className="text-body text-foreground">
              Refunds are issued{" "}
              <mark className="rounded-sm bg-highlight px-0.5 text-highlight-foreground">
                within 14 days of the request
              </mark>
              , to the original payment method.
            </p>
            <span className="w-fit rounded-md bg-highlight px-1.5 py-0.5 text-meta text-highlight-foreground">
              refund-policy.pdf · page 4
            </span>
          </figure>

          <ul className="flex flex-col gap-3">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-center gap-3 text-body text-muted-foreground"
              >
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>

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
