import { MessageSquare } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { CitedText } from "@/components/shared/CitedText";
import { ReplayButton } from "@/components/shared/ReplayButton";
import { cn } from "@/lib/utils";

const CHATS = [
  { title: "Vacation policy", time: "Today" },
  { title: "Q3 board minutes", time: "Yesterday" },
  { title: "Onboarding checklist", time: "Monday" },
];

/**
 * Beside the sign in form: your recent chats slide in, the latest one opens, and its answer
 * shows the passage it was drawn from. Plays once; Replay runs it again.
 */
export function ResumePanel() {
  const reduceMotion = useReducedMotion();
  const [run, setRun] = useState(0);
  const [rows, setRows] = useState(CHATS.length);
  const [open, setOpen] = useState(true);
  const [cited, setCited] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the sequence
  useEffect(() => {
    if (reduceMotion) {
      setRows(CHATS.length);
      setOpen(true);
      setCited(true);
      return;
    }
    setRows(0);
    setOpen(false);
    setCited(false);

    const timers = CHATS.map((_, index) =>
      window.setTimeout(() => setRows(index + 1), 450 + index * 120),
    );
    timers.push(window.setTimeout(() => setOpen(true), 1600));
    timers.push(window.setTimeout(() => setCited(true), 2300));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reduceMotion, run]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-display text-foreground">Welcome back.</h2>
        <p className="text-body text-muted-foreground">
          Your chats and sources are right where you left them.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="sr-only">
          Example: the latest chat, Vacation policy, answers that full-time
          employees get 25 days of paid leave per year, from page 12 of
          employee-handbook.pdf.
        </p>

        <div
          aria-hidden="true"
          className="rounded-2xl border border-border bg-background p-2 shadow-[var(--ragify-shadow)]"
        >
          <p className="px-3 pb-1 pt-2 text-meta text-muted-foreground">
            Recent chats
          </p>
          <ul>
            {CHATS.map((chat, index) => (
              <li
                key={chat.title}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-[opacity,transform,background-color] duration-300 ease-snap",
                  index < rows
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-2 opacity-0",
                  index === 0 && open && "bg-accent",
                )}
              >
                {index === 0 && (
                  <span
                    className={cn(
                      "absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary transition-opacity duration-300 ease-snap",
                      open ? "opacity-100" : "opacity-0",
                    )}
                  />
                )}
                <MessageSquare
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate text-body text-foreground">
                  {chat.title}
                </span>
                <span className="text-meta text-muted-foreground">
                  {chat.time}
                </span>
              </li>
            ))}
          </ul>

          <div
            className={cn(
              "mx-1 mb-1 mt-1 rounded-xl border border-border bg-card p-4 transition-[opacity,transform] duration-300 ease-snap",
              open ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
          >
            <p className="text-meta text-muted-foreground">
              How many vacation days do I get?
            </p>
            <p className="mt-2 text-body text-foreground">
              Full-time employees get{" "}
              <CitedText active={cited}>25 days of paid leave</CitedText> per
              year.
            </p>
            <p
              className={cn(
                "mt-3 flex items-center gap-2 text-meta text-muted-foreground transition-opacity duration-300 ease-snap",
                cited ? "opacity-100" : "opacity-0",
              )}
            >
              Sources
              <span className="rounded-md bg-highlight px-1.5 py-0.5 text-highlight-foreground">
                employee-handbook.pdf · page 12
              </span>
            </p>
          </div>
        </div>

        {!reduceMotion && (
          <ReplayButton
            onClick={() => setRun((n) => n + 1)}
            visible={open && cited}
          />
        )}
      </div>
    </>
  );
}
