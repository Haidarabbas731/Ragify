import {
  Check,
  ChevronRight,
  FileText,
  Loader2,
  Search,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AgentStep } from "@/types/api";

/** Rows shown while the agent is working; earlier finished ones fold into a count. */
const LIVE_ROWS = 3;

interface AgentTraceProps {
  steps: AgentStep[];
  /** The agent is still working here: no answer text has followed these steps yet. */
  live: boolean;
}

/** What one tool call did, in plain language. */
function describeStep(step: AgentStep): string {
  if (step.name === "list_documents") {
    if (step.status === "running") return "Looking up your documents";
    if (step.status === "failed") return "Couldn't look up your documents";
    return step.documents
      ? `Found ${pluralize(step.documents, "document")}`
      : "No documents uploaded yet";
  }
  if (step.status === "running") return "Searching your documents";
  if (step.status === "failed") return "Search unavailable";
  if (step.status === "empty") return "No matching passages found";
  return `Read ${pluralize(step.chunks, "passage")} from ${pluralize(
    step.documents,
    "document",
  )}`;
}

/** One line for the collapsed trace, e.g. "Searched 2 times · Looked up your documents". */
function summarize(steps: AgentStep[]): string {
  const searches = steps.filter((s) => s.name === "search_documents").length;
  const lookups = steps.length - searches;
  return [
    searches > 0 &&
      (searches === 1
        ? "Searched your documents"
        : `Searched ${searches} times`),
    lookups > 0 && "Looked up your documents",
  ]
    .filter(Boolean)
    .join(" · ");
}

function StepIcon({ step }: { step: AgentStep }) {
  const className = "size-4 shrink-0";
  if (step.status === "running") {
    return (
      <Loader2
        className={cn(className, "animate-spin text-primary")}
        aria-hidden="true"
      />
    );
  }
  if (step.status === "failed") {
    return (
      <TriangleAlert
        className={cn(className, "text-destructive")}
        aria-hidden="true"
      />
    );
  }
  const Icon = step.status === "empty" ? Search : Check;
  return (
    <Icon
      className={cn(className, "text-muted-foreground")}
      aria-hidden="true"
    />
  );
}

function StepRow({ step }: { step: AgentStep }) {
  return (
    <li className="step-in flex min-h-5 items-center gap-3">
      <StepIcon step={step} />
      <span className="text-body text-muted-foreground">
        {describeStep(step)}
        {step.status === "running" && "…"}
      </span>
      {step.query && (
        <span
          className="min-w-0 max-w-[40ch] truncate rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/80"
          title={step.query}
        >
          {step.query}
        </span>
      )}
    </li>
  );
}

/**
 * A run of tool calls the chat agent made at one point in an answer.
 *
 * While it works, each tool call is a row that stays after it finishes (the last
 * {@link LIVE_ROWS} are shown; earlier ones fold into a count). Once the answer is
 * done it collapses to one line you can open again. The same rows are saved with the
 * message, so reopening a conversation shows them too.
 */
export function AgentTrace({ steps, live }: AgentTraceProps) {
  const [open, setOpen] = useState(false);
  const hidden = live ? Math.max(0, steps.length - LIVE_ROWS) : 0;
  const rows = steps.slice(hidden);
  const thinking = live && !steps.some((s) => s.status === "running");
  const failed = steps.some((s) => s.status === "failed");
  const expanded = live || open;

  return (
    <output aria-live="polite" className="fade-in-soft my-3 block">
      {!live && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="-ml-1 flex items-center gap-1.5 rounded-md px-1 py-0.5 text-meta text-muted-foreground transition-[color,transform] duration-150 ease-snap hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200 ease-snap",
              open && "rotate-90",
            )}
            aria-hidden="true"
          />
          {failed ? (
            <TriangleAlert
              className="size-3.5 text-destructive"
              aria-hidden="true"
            />
          ) : (
            <FileText className="size-3.5" aria-hidden="true" />
          )}
          {summarize(steps)}
        </button>
      )}

      <div className="collapse-rows" data-collapsed={!expanded}>
        <div>
          <ul className={cn("flex flex-col gap-2", !live && "pt-2")}>
            {hidden > 0 && (
              <li className="text-meta text-muted-foreground">
                +{pluralize(hidden, "earlier step")}
              </li>
            )}
            {rows.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
            {thinking && (
              <li className="step-in flex min-h-5 items-center gap-3">
                <Loader2
                  className="size-4 shrink-0 animate-spin text-primary"
                  aria-hidden="true"
                />
                <span className="text-body text-muted-foreground">
                  Thinking…
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </output>
  );
}
