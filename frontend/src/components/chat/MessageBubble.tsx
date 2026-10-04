import { Fragment } from "react";
import { formatTime } from "@/lib/format";
import type { AgentStep, ChatMessage } from "@/types/api";
import { AgentTrace } from "./AgentTrace";
import { MarkdownContent } from "./MarkdownContent";
import { SourcesLine } from "./SourcesLine";

export interface DisplayMessage extends ChatMessage {
  id: string;
}

interface MessageBubbleProps {
  message: DisplayMessage;
  /** This is the answer being prepared right now. */
  live?: boolean;
}

interface MessagePart {
  /** Where in the answer this part starts; unique, so it works as a React key. */
  key: string;
  /** Tool calls made at this point in the answer (none for text before the first call). */
  steps: AgentStep[];
  /** The answer text that follows them. */
  text: string;
}

/** Cuts an answer where the agent used tools, so each run of calls sits between the text around it. */
function splitAtSteps(content: string, steps: AgentStep[]): MessagePart[] {
  const runs: AgentStep[][] = [];
  for (const step of steps) {
    const last = runs[runs.length - 1];
    if (last && last[0].offset === step.offset) last.push(step);
    else runs.push([step]);
  }
  const parts = runs.map((run, i) => ({
    key: String(run[0].offset),
    steps: run,
    text: content.slice(run[0].offset, runs[i + 1]?.[0].offset).trim(),
  }));
  const intro = content.slice(0, runs[0]?.[0].offset).trim();
  return intro ? [{ key: "intro", steps: [], text: intro }, ...parts] : parts;
}

/**
 * One chat message. Your messages sit in a tinted bubble on the right; answers are
 * plain text on the page (nothing to decorate on a reading surface) with what the agent did above
 * and their sources below.
 */
export function MessageBubble({ message, live = false }: MessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <p
          className="step-in max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-secondary px-4 py-2.5 text-body text-secondary-foreground"
          title={formatTime(message.timestamp)}
        >
          {message.content}
        </p>
      </div>
    );
  }

  const parts = splitAtSteps(message.content, message.steps ?? []);
  // The assistant placeholder shows only a "Thinking" trace until the first step or text arrives.
  if (parts.length === 0 && !live) return null;

  return (
    <div className="flex flex-col">
      {parts.length === 0 && <AgentTrace steps={[]} live />}
      {parts.map((part, index) => (
        <Fragment key={part.key}>
          {part.steps.length > 0 && (
            <AgentTrace
              steps={part.steps}
              live={live && index === parts.length - 1 && !part.text}
            />
          )}
          {part.text && <MarkdownContent content={part.text} />}
        </Fragment>
      ))}
      {message.sources && message.sources.length > 0 && (
        <SourcesLine sources={message.sources} />
      )}
      {message.content && (
        <p className="mt-2 text-meta tabular-nums text-muted-foreground">
          {formatTime(message.timestamp)}
        </p>
      )}
    </div>
  );
}
