import { useCallback, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentActivity as AgentActivityState } from "@/hooks/useChatStream";
import { AgentActivity } from "./AgentActivity";
import { ChatEmptyState } from "./ChatEmptyState";
import { type DisplayMessage, MessageBubble } from "./MessageBubble";

interface MessageListProps {
  messages: DisplayMessage[];
  /** An existing conversation is still loading. */
  loading: boolean;
  isStreaming: boolean;
  /** Streamed answer text has started, so the activity status is no longer needed. */
  hasResponseText: boolean;
  activity: AgentActivityState | null;
  onPickPrompt: (prompt: string) => void;
}

/** Scrollable conversation. Follows new text while you are at the bottom, and stays put if you scroll up. */
export function MessageList({
  messages,
  loading,
  isStreaming,
  hasResponseText,
  activity,
  onPickPrompt,
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    stickToBottom.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  // Follow the conversation as it grows. Scrolls only this container (never an ancestor)
  // and is instant while streaming so it doesn't lag the text.
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll whenever messages change
  useEffect(() => {
    const el = containerRef.current;
    if (el && stickToBottom.current) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: isStreaming ? "auto" : "smooth",
      });
    }
  }, [messages, isStreaming]);

  const isEmpty = messages.length === 0 && !isStreaming && !loading;

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6"
    >
      <div className="mx-auto flex h-full w-full max-w-[720px] flex-col gap-6">
        {loading ? (
          <div className="flex flex-col gap-6" aria-busy="true">
            <Skeleton className="ml-auto h-10 w-2/5" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="ml-auto h-10 w-1/3" />
          </div>
        ) : isEmpty ? (
          <ChatEmptyState onPickPrompt={onPickPrompt} />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isStreaming && !hasResponseText && (
          <AgentActivity activity={activity ?? { phase: "thinking" }} />
        )}
      </div>
    </div>
  );
}
