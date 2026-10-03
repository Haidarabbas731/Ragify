import { ArrowUp } from "lucide-react";
import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Question box that opens a new chat and sends the question straight away. */
export function AskBar() {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    // The nonce lets the chat page tell a fresh question from a reloaded one.
    navigate("/chat", { state: { prefill: text, nonce: Date.now() } });
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Input
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask your documents…"
        aria-label="Ask your documents"
        className="h-12 rounded-2xl pl-4 pr-14 text-body shadow-[var(--ragify-shadow)]"
      />
      <Button
        type="submit"
        size="icon-sm"
        disabled={!question.trim()}
        aria-label="Ask"
        className="absolute right-2 top-1/2 -translate-y-1/2"
      >
        <ArrowUp />
      </Button>
    </form>
  );
}
