import { Check, FileText } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { CitedText } from "@/components/shared/CitedText";
import { ReplayButton } from "@/components/shared/ReplayButton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";

const QUESTION = "How many vacation days do I get?";

type Step = 0 | 1 | 2 | 3;

/**
 * Beside the create account form: a three-step rail fills in as a file is added, read and
 * asked about. Plays once; Replay runs it again; reduced motion shows the finished state.
 */
export function OnboardPanel() {
  const reduceMotion = useReducedMotion();
  const [run, setRun] = useState(0);
  const [step, setStep] = useState<Step>(3);
  const [typed, setTyped] = useState(QUESTION.length);
  const [answered, setAnswered] = useState(true);
  const [cited, setCited] = useState(true);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `run` restarts the sequence
  useEffect(() => {
    if (reduceMotion) {
      setStep(3);
      setTyped(QUESTION.length);
      setAnswered(true);
      setCited(true);
      return;
    }
    setStep(0);
    setTyped(0);
    setAnswered(false);
    setCited(false);

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms));

    at(450, () => setStep(1));
    at(1500, () => setStep(2));
    at(2700, () => setStep(3));
    let elapsed = 3100;
    for (let i = 1; i <= QUESTION.length; i++) {
      elapsed += i % 6 === 0 ? 55 : 28;
      const count = i;
      at(elapsed, () => setTyped(count));
    }
    at(elapsed + 400, () => setAnswered(true));
    at(elapsed + 1100, () => setCited(true));
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [reduceMotion, run]);

  const typing = step === 3 && typed < QUESTION.length;
  const finished = step === 3 && cited;
  const fileState = step >= 3 ? "ready" : step === 2 ? "indexing" : "uploading";

  const nodes = [
    { title: "Add a document", done: step >= 2, active: step === 1 },
    { title: "Ragify reads it", done: step >= 3, active: step === 2 },
    { title: "Ask, then check the source", done: finished, active: step === 3 },
  ];

  return (
    <>
      <div className="flex flex-col gap-3">
        <h2 className="text-display text-foreground">
          From a file to an answer, in a minute.
        </h2>
        <p className="text-body text-muted-foreground">
          Add a document, let Ragify read it, then ask what you need to know.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="sr-only">
          Example: employee-handbook.pdf is uploaded and indexed, then the
          question "{QUESTION}" is answered with 25 days of paid leave, citing
          page 12.
        </p>

        <ol aria-hidden="true">
          {nodes.map((node, index) => (
            <li key={node.title} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border text-meta font-semibold transition-[background-color,border-color,color] duration-300 ease-snap",
                    node.done
                      ? "border-primary bg-primary text-primary-foreground"
                      : node.active
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground",
                  )}
                >
                  {node.done ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                {index < nodes.length - 1 && (
                  <span className="my-1 w-px flex-1 bg-border">
                    <span
                      className={cn(
                        "block h-full w-full origin-top bg-primary transition-transform duration-500 ease-snap",
                        node.done ? "scale-y-100" : "scale-y-0",
                      )}
                    />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1 pb-6 last:pb-0">
                <p className="pt-1 text-section text-foreground">
                  {node.title}
                </p>

                {index === 0 && (
                  <div
                    className={cn(
                      "mt-3 flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 shadow-[var(--ragify-shadow)] transition-[opacity,transform] duration-300 ease-snap",
                      step >= 1
                        ? "translate-y-0 opacity-100"
                        : "-translate-y-2 opacity-0",
                    )}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <FileText className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body text-foreground">
                        employee-handbook.pdf
                      </p>
                      <p className="text-meta text-muted-foreground">2.1 MB</p>
                    </div>
                    <span key={fileState} className="step-in">
                      {fileState === "ready" ? (
                        <StatusBadge status="active" />
                      ) : (
                        <StatusBadge
                          status="processing"
                          label={
                            fileState === "uploading" ? "Uploading" : "Indexing"
                          }
                        />
                      )}
                    </span>
                  </div>
                )}

                {index === 1 && (
                  <p
                    className={cn(
                      "mt-1 text-body text-muted-foreground transition-opacity duration-300 ease-snap",
                      step >= 2 ? "opacity-100" : "opacity-0",
                    )}
                  >
                    {step >= 3
                      ? "Split into searchable passages."
                      : "Splitting it into searchable passages…"}
                  </p>
                )}

                {index === 2 && (
                  <div
                    className={cn(
                      "mt-3 rounded-xl border border-border bg-background p-4 shadow-[var(--ragify-shadow)] transition-opacity duration-300 ease-snap",
                      step >= 3 ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <p className="min-h-5 text-meta text-muted-foreground">
                      {QUESTION.slice(0, typed)}
                      {typing && (
                        <span className="ml-px inline-block h-[1.1em] w-px translate-y-[0.2em] bg-current" />
                      )}
                    </p>
                    <div
                      className={cn(
                        "transition-[opacity,transform] duration-300 ease-snap",
                        answered
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0",
                      )}
                    >
                      <p className="mt-2 text-body text-foreground">
                        Full-time employees get{" "}
                        <CitedText active={cited}>
                          25 days of paid leave
                        </CitedText>{" "}
                        per year.
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
                )}
              </div>
            </li>
          ))}
        </ol>

        {!reduceMotion && (
          <ReplayButton
            onClick={() => setRun((n) => n + 1)}
            visible={finished}
          />
        )}
      </div>
    </>
  );
}
