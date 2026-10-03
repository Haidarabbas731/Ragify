import { ArrowUp, Loader2 } from "lucide-react";
import { type KeyboardEvent, type RefObject, useLayoutEffect } from "react";
import { CollectionSelect } from "@/components/shared/CollectionSelect";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_HEIGHT = 144; // about six lines

interface ComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  collections: {
    collection_id: string;
    name: string;
    document_count: number;
  }[];
  collectionId: string | null;
  onCollectionChange: (collectionId: string | null) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/** Message box: grows with the text, Enter sends, Shift+Enter adds a line, collection chip inside. */
export function Composer({
  value,
  onChange,
  onSend,
  isStreaming,
  collections,
  collectionId,
  onCollectionChange,
  textareaRef,
}: ComposerProps) {
  // Resize to fit the content, up to MAX_HEIGHT, then scroll.
  // biome-ignore lint/correctness/useExhaustiveDependencies: resize whenever the text changes
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
  }, [value, textareaRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim().length > 0 && !isStreaming;

  return (
    <div className="shrink-0 px-4 pb-4 sm:px-6">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="rounded-2xl border border-input bg-card p-2 shadow-[var(--ragify-shadow)] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about your documents…"
            rows={1}
            className="min-h-0 resize-none border-0 bg-transparent px-2 py-1.5 text-body shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <CollectionSelect
              collections={collections}
              value={collectionId}
              onChange={onCollectionChange}
              className="h-8 w-auto min-w-0 border-0 bg-muted text-meta"
            />
            <Button
              size="icon-sm"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Send message"
            >
              {isStreaming ? <Loader2 className="animate-spin" /> : <ArrowUp />}
            </Button>
          </div>
        </div>
        <p className="mt-2 hidden text-center text-meta text-muted-foreground sm:block">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}
