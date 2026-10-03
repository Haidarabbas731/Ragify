import { ArrowUp } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CollectionSelect } from "@/components/shared/CollectionSelect";
import { Button } from "@/components/ui/button";
import { useCollections } from "@/hooks/useCollections";

/** Question box that opens a new chat, scoped to a collection if chosen, and sends the question. */
export function AskBar() {
  const navigate = useNavigate();
  const { data } = useCollections();
  const [question, setQuestion] = useState("");
  const [collectionId, setCollectionId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    // The nonce lets the chat page tell a fresh question from a reloaded one.
    navigate("/chat", {
      state: { prefill: text, nonce: Date.now(), collectionId },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-input bg-card p-2 shadow-[var(--ragify-shadow)] transition-shadow duration-150 focus-within:ring-2 focus-within:ring-ring"
    >
      <input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your documents…"
        aria-label="Ask your documents"
        autoComplete="off"
        className="h-10 w-full bg-transparent px-2 text-base outline-none placeholder:text-muted-foreground md:text-body"
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        <CollectionSelect
          collections={data?.collections ?? []}
          value={collectionId}
          onChange={setCollectionId}
          className="h-8 w-auto min-w-0 border-0 bg-muted text-meta"
        />
        <Button
          type="submit"
          size="icon-sm"
          disabled={!question.trim()}
          aria-label="Ask"
        >
          <ArrowUp />
        </Button>
      </div>
    </form>
  );
}
