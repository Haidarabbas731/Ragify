import { formatTime } from "@/lib/format";
import type { ChatMessage } from "@/types/api";
import { MarkdownContent } from "./MarkdownContent";
import { SourcesLine } from "./SourcesLine";

export interface DisplayMessage extends ChatMessage {
  id: string;
}

interface MessageBubbleProps {
  message: DisplayMessage;
}

/**
 * One chat message. Your messages sit in a tinted bubble on the right; answers are
 * plain text on the page (nothing to decorate on a reading surface) with their sources below.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
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

  // The assistant placeholder stays empty until the first streamed text arrives.
  if (!message.content) return null;

  return (
    <div className="flex flex-col">
      <MarkdownContent content={message.content} />
      {message.sources && message.sources.length > 0 && (
        <SourcesLine sources={message.sources} />
      )}
      <p className="mt-2 text-meta tabular-nums text-muted-foreground">
        {formatTime(message.timestamp)}
      </p>
    </div>
  );
}
