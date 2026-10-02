import { Check, Search, TriangleAlert } from "lucide-react";
import type { AgentActivity as AgentActivityState } from "../../hooks/useChatStream";

interface AgentActivityProps {
  activity: AgentActivityState;
}

/**
 * Plural helper for the passage and document counts.
 */
function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

/**
 * Describes what the assistant is doing right now, in plain language.
 */
function describe(activity: AgentActivityState): string {
  switch (activity.phase) {
    case "searching":
      return "Searching your documents";
    case "reading":
      return `Reading ${count(activity.chunks ?? 0, "passage")} from ${count(
        activity.documents ?? 0,
        "document",
      )}`;
    case "empty":
      return "No matching passages found";
    case "failed":
      return "Search unavailable";
    default:
      return "Thinking";
  }
}

/**
 * Live status of the chat agent while it works on an answer.
 *
 * Shows "Thinking", then "Searching your documents" with the search the assistant chose,
 * then "Reading N passages from M documents". The label swaps with a short ease-out
 * (see `.agent-step-in`); the pulsing dots stay put so the bubble never changes size.
 * Rendered as <output> so changes are announced politely to screen readers.
 */
export function AgentActivity({ activity }: AgentActivityProps) {
  const { phase, query } = activity;
  const showQuery = phase === "searching" && Boolean(query);

  return (
    <div className="flex justify-start animate-in fade-in duration-200">
      <output
        aria-live="polite"
        className="block bg-card border border-border rounded-xl rounded-tl-none px-5 py-4 shadow-md max-w-[80%]"
      >
        <div className="flex items-center gap-3 min-h-5">
          {phase === "failed" ? (
            <TriangleAlert
              className="w-4 h-4 text-destructive shrink-0"
              aria-hidden="true"
            />
          ) : phase === "searching" ? (
            <Search
              className="w-4 h-4 text-primary shrink-0 animate-pulse"
              aria-hidden="true"
            />
          ) : phase === "empty" ? (
            <Check
              className="w-4 h-4 text-muted-foreground shrink-0"
              aria-hidden="true"
            />
          ) : (
            <div className="flex gap-1.5 shrink-0" aria-hidden="true">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <div
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              />
              <div
                className="w-2 h-2 bg-primary rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              />
            </div>
          )}

          {/* Keyed so a new phase replays the swap animation */}
          <span
            key={phase}
            className="agent-step-in text-sm text-muted-foreground font-sans"
          >
            {describe(activity)}
            {phase === "searching" ||
            phase === "reading" ||
            phase === "thinking"
              ? "…"
              : ""}
          </span>

          {showQuery && (
            <span
              key={query}
              className="agent-step-in min-w-0 max-w-[40ch] truncate rounded-md bg-muted px-2 py-0.5 text-xs text-foreground/80 font-mono"
              title={query}
            >
              {query}
            </span>
          )}
        </div>
      </output>
    </div>
  );
}
