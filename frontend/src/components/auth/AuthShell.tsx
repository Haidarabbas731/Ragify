import { ArrowLeft, Moon, Sun } from "lucide-react";
import {
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { Wordmark } from "@/components/shared/Wordmark";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  /** What fills the brand panel beside the form (large screens only). */
  panel: ReactNode;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** Links under the form, e.g. "Don't have an account?". */
  footer?: ReactNode;
  /** "top" for forms that grow while filled in, so content above the growth stays put. */
  align?: "center" | "top";
}

/** Split layout for sign in, sign up and password reset: brand panel beside a centered form. */
export function AuthShell({
  panel,
  title,
  description,
  children,
  footer,
  align = "center",
}: AuthShellProps) {
  const { darkMode, toggleDarkMode } = useDarkMode();

  // A form that grows past the window height would otherwise show a scrollbar and shift both columns sideways.
  useEffect(() => {
    document.documentElement.classList.add("auth-no-scrollbar");
    return () => document.documentElement.classList.remove("auth-no-scrollbar");
  }, []);

  // "top" alignment: centre the form from its resting height (late-loading fields included, growing
  // parts like the strength panel and error messages excluded), so it stays put while they appear.
  const mainRef = useRef<HTMLElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [padTop, setPadTop] = useState<number>();

  useLayoutEffect(() => {
    if (align !== "top") return;
    const main = mainRef.current;
    const column = columnRef.current;
    const content = contentRef.current;
    if (!main || !column || !content) return;

    const edge = Number.parseFloat(getComputedStyle(column).paddingBottom);
    const update = () => {
      let restHeight = content.offsetHeight;
      for (const el of content.querySelectorAll<HTMLElement>(
        '[data-transient], [role="alert"]',
      )) {
        restHeight -= el.offsetHeight;
      }
      const bottom = Number.parseFloat(getComputedStyle(main).paddingBottom);
      const space = window.innerHeight - column.offsetTop - bottom;
      setPadTop(edge + Math.max(0, (space - restHeight - edge * 2) / 2));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [align]);

  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[5fr_6fr]">
      <aside className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:sticky lg:top-0 lg:flex lg:h-dvh">
        <Wordmark />

        <div className="flex w-full max-w-lg flex-col gap-8">{panel}</div>

        <span aria-hidden="true" />
      </aside>

      <main ref={mainRef} className="flex min-w-0 flex-col px-6 py-6 sm:px-10">
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

        <div
          ref={columnRef}
          style={align === "top" ? { paddingTop: padTop } : undefined}
          className={cn(
            "mx-auto flex w-full max-w-sm flex-1 flex-col gap-8 py-10",
            align === "top" ? "justify-start" : "justify-center",
          )}
        >
          <div ref={contentRef} className="flex flex-col gap-8">
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
        </div>
      </main>
    </div>
  );
}
