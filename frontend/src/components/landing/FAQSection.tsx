import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    question: "What file types can I upload?",
    answer: "PDF, Word documents (DOCX), plain text (TXT) and Markdown (MD).",
  },
  {
    question: "How does it find the right passages?",
    answer:
      "When you upload a file, Ragify splits it into passages and indexes them by meaning. When you ask a question, it retrieves the most relevant passages from your documents and gives them to the AI as context. This is called retrieval-augmented generation (RAG). The answer lists the documents it used.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your files are stored privately and only your account can open them. To write an answer, Ragify sends your question and the relevant excerpts to the AI provider you use (Gemini or OpenRouter, with your own key), so avoid uploading anything you would not be comfortable sending to that provider.",
  },
  {
    question: "Do I need my own API key?",
    answer:
      "Yes. Chat runs on your own key. In your profile choose Gemini or OpenRouter, pick a model and save your key. It is stored encrypted and only the last four characters are shown afterwards.",
  },
  {
    question: "Can I search just some of my documents?",
    answer:
      "Yes. Group documents into collections, then choose a collection when you ask a question. Choose all collections to search everything.",
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className="border-b border-border last:border-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-4 rounded-md py-4 text-left text-section text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {question}
          {open ? (
            <Minus className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <Plus className="size-4 shrink-0 text-muted-foreground" />
          )}
        </button>
      </h3>
      <div id={panelId} className={cn("faq-answer", open && "open")}>
        <div>
          <p className="pb-4 text-body text-muted-foreground">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-20 border-t border-border bg-muted/40 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-3xl px-6">
        <Reveal>
          <p className="text-meta font-medium text-primary">FAQ</p>
          <h2 className="mt-2 text-display text-foreground">
            Questions people ask
          </h2>
        </Reveal>
        <Reveal delay={70} className="mt-10">
          <div className="rounded-2xl border border-border bg-card px-6 shadow-[var(--ragify-shadow)]">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} {...faq} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
