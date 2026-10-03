import { Sparkles } from "lucide-react";

const STARTER_PROMPTS = [
  "Summarize my most recent document",
  "What are the key points across my documents?",
  "Where do my documents mention deadlines?",
];

interface ChatEmptyStateProps {
  /** Called with the chosen prompt so the composer can fill with it. */
  onPickPrompt: (prompt: string) => void;
}

/** Shown before the first message: what chat does and a few ways to begin. */
export function ChatEmptyState({ onPickPrompt }: ChatEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Sparkles className="size-6" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="text-title text-foreground">Ask your documents</h2>
        <p className="max-w-sm text-body text-muted-foreground">
          Answers come from your uploaded files, and the documents used are
          shown with every answer.
        </p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-2">
        {STARTER_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onPickPrompt(prompt)}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-left text-body text-foreground transition-[background-color,transform] duration-150 ease-snap hover:bg-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
