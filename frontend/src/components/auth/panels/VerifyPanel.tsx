import { ClipboardPaste, Clock, MailSearch } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/shared/Logo";
import { ReplayButton } from "@/components/shared/ReplayButton";
import { cn } from "@/lib/utils";

const EXAMPLE_CODE = "482913";
const DIGIT_STAGGER_MS = 70;

const POINTS = [
  { icon: Clock, text: "The code works for 10 minutes." },
  { icon: MailSearch, text: "Not there yet? Check your spam folder." },
  {
    icon: ClipboardPaste,
    text: "You can paste it, spaces and dashes included.",
  },
];

/**
 * Beside the verify screen: an example email arrives and its code appears digit by digit.
 * The example has its own sample code and never touches the real boxes. Plays once; Replay
 * runs it again; reduced motion shows the finished state.
 */
export function VerifyPanel() {
  const reduceMotion = useReducedMotion();
  const [run, setRun] = useState(0);
  const [arrived, setArrived] = useState(true);
  const [finished, setFinished] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the sequence
  useEffect(() => {
    if (reduceMotion) {
      setArrived(true);
      setFinished(true);
      return;
    }
    setArrived(false);
    setFinished(false);
    const timers = [
      window.setTimeout(() => setArrived(true), 250),
      window.setTimeout(
        () => setFinished(true),
        250 + 350 + 400 + 6 * DIGIT_STAGGER_MS,
      ),
    ];
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reduceMotion, run]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-display text-foreground">Check your inbox.</h2>
        <p className="text-body text-muted-foreground">
          We sent a 6-digit code. It usually arrives within a few seconds.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="sr-only">
          Example: an email from Ragify with the subject "Your Ragify code is
          482 913" and the code 482913 in large type.
        </p>

        <div
          aria-hidden="true"
          className={cn(
            "rounded-xl border border-border bg-background p-4 shadow-[var(--ragify-shadow)] transition-[opacity,transform] duration-[350ms] ease-snap",
            arrived ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
          )}
        >
          <div className="flex items-center gap-2">
            <Logo size={20} className="rounded-sm" />
            <span className="text-meta font-semibold text-foreground">
              Ragify
            </span>
            <span className="ml-auto text-meta text-muted-foreground">
              Example
            </span>
          </div>
          <p className="mt-3 text-body font-medium text-foreground">
            Your Ragify code is 482 913
          </p>
          <div className="mt-3 flex min-h-[3.25rem] items-center justify-center gap-3 rounded-lg bg-muted px-3 py-3 text-stat tabular-nums text-foreground">
            {arrived &&
              EXAMPLE_CODE.split("").map((digit, index) => (
                <span
                  // biome-ignore lint/suspicious/noArrayIndexKey: fixed six digits; `run` replays them
                  key={`${run}-${index}`}
                  className="keycap-glyph"
                  style={
                    {
                      "--keycap-delay": `${reduceMotion ? 0 : 350 + index * DIGIT_STAGGER_MS}ms`,
                    } as React.CSSProperties
                  }
                >
                  {digit}
                </span>
              ))}
          </div>
          <p className="mt-3 text-meta text-muted-foreground">
            Enter this code in Ragify to finish creating your account.
          </p>
        </div>

        {!reduceMotion && (
          <ReplayButton
            onClick={() => setRun((n) => n + 1)}
            visible={finished}
          />
        )}
      </div>

      <ul className="flex flex-col gap-4">
        {POINTS.map((point) => (
          <li key={point.text} className="flex items-center gap-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <point.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="text-body text-muted-foreground">
              {point.text}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
