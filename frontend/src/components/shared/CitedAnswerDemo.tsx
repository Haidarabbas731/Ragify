import { FileText } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CitedText } from "./CitedText";
import { ReplayButton } from "./ReplayButton";

const QUESTION = "What does the policy say about refunds?";
const BEFORE = "Refunds are issued ";
const CITED = "within 14 days of the request";
const AFTER = ", to the original payment method.";

/**
 * Used on the landing page and beside the sign in and sign up forms.
 *
 * A small, honest picture of what Ragify does: a question is asked, the answer appears, and
 * the passage it came from lights up in the source document. Plays once; Replay runs it again.
 * Reduced motion shows the finished state.
 */
export function CitedAnswerDemo() {
  const reduceMotion = useReducedMotion();
  const [run, setRun] = useState(0);
  const [typed, setTyped] = useState(QUESTION.length);
  const [answered, setAnswered] = useState(true);
  const [cited, setCited] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the sequence
  useEffect(() => {
    if (reduceMotion) {
      setTyped(QUESTION.length);
      setAnswered(true);
      setCited(true);
      return;
    }
    setTyped(0);
    setAnswered(false);
    setCited(false);

    const timers: number[] = [];
    let elapsed = 700;
    for (let i = 1; i <= QUESTION.length; i++) {
      elapsed += i % 6 === 0 ? 55 : 30;
      timers.push(window.setTimeout(() => setTyped(i), elapsed));
    }
    timers.push(window.setTimeout(() => setAnswered(true), elapsed + 400));
    timers.push(window.setTimeout(() => setCited(true), elapsed + 1100));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reduceMotion, run]);

  const typing = typed < QUESTION.length;
  const finished = answered && cited;

  return (
    <figure className="relative flex flex-col gap-3">
      <figcaption className="sr-only">
        Example: asked "{QUESTION}", Ragify answers "{BEFORE}
        {CITED}
        {AFTER}" and points to page 4 of refund-policy.pdf.
      </figcaption>

      <div aria-hidden="true" className="flex flex-col gap-3">
        {/* The question and answer */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--ragify-shadow)]">
          <div className="flex justify-end">
            <p className="min-h-[2.5rem] max-w-[85%] rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-body text-secondary-foreground">
              {QUESTION.slice(0, typed)}
              {typing && (
                <span className="ml-px inline-block h-[1.1em] w-px translate-y-[0.2em] bg-current" />
              )}
              {/* Keeps the bubble the same size while it types */}
              <span className="invisible">{QUESTION.slice(typed)}</span>
            </p>
          </div>

          <div
            className={cn(
              "mt-4 transition-[opacity,transform] duration-300 ease-snap",
              answered
                ? "translate-y-0 opacity-100"
                : "translate-y-2 opacity-0",
            )}
          >
            <p className="text-body text-foreground">
              {BEFORE}
              <CitedText active={cited}>{CITED}</CitedText>
              {AFTER}
            </p>
            <p
              className={cn(
                "mt-3 flex items-center gap-2 text-meta text-muted-foreground transition-opacity duration-300 ease-snap",
                cited ? "opacity-100" : "opacity-0",
              )}
            >
              Sources
              <span className="rounded-md bg-highlight px-1.5 py-0.5 text-highlight-foreground">
                refund-policy.pdf · page 4
              </span>
            </p>
          </div>
        </div>

        {/* The source document, with the same passage marked */}
        <div className="ml-6 rounded-2xl border border-border bg-muted/50 p-5">
          <div className="mb-3 flex items-center gap-2 text-meta text-muted-foreground">
            <FileText className="size-3.5" />
            refund-policy.pdf
            <span className="ml-auto">Page 4</span>
          </div>
          <div className="space-y-2 text-body text-muted-foreground">
            <p className="font-semibold text-foreground">
              4. Refunds and cancellations
            </p>
            <p>Orders can be cancelled at any time before they ship.</p>
            <p>
              {BEFORE}
              <CitedText active={cited}>{CITED}</CitedText>
              {AFTER}
            </p>
            <p>Shipping fees are not refundable once an order has left.</p>
          </div>
        </div>
      </div>

      {!reduceMotion && (
        <ReplayButton onClick={() => setRun((n) => n + 1)} visible={finished} />
      )}
    </figure>
  );
}
