import { Minus, Plus } from "lucide-react";
import { useState } from "react";

const faqs = [
  {
    question: "What file formats does Ragify support?",
    answer:
      "Ragify supports PDF, Word documents (DOCX), plain text (TXT), and Markdown (MD) files. Each file can be up to 50MB.",
  },
  {
    question: "How does the AI know which documents to search?",
    answer:
      "When you upload a document, Ragify chunks it into segments and generates vector embeddings for each chunk. When you ask a question, the system retrieves the most semantically relevant chunks across all your documents and sends them to the AI as context — this is Retrieval-Augmented Generation (RAG).",
  },
  {
    question: "Is my data private and secure?",
    answer:
      "Yes. Your documents are stored privately and are only accessible to your account. We do not share or use your documents to train AI models. All data is isolated per user.",
  },
  {
    question: "Can I organize documents into categories?",
    answer:
      "Yes. You can create Collections to group documents by project, topic, or any structure that makes sense for you. Collections make it easy to scope your AI chat to specific sets of documents.",
  },
  {
    question: "What happens when I reach my storage limit?",
    answer:
      "Each account has a 1GB storage limit. When you're approaching the limit, you'll see a warning in your dashboard. You can free up space by deleting documents you no longer need.",
  },
  {
    question: "Do I need a credit card to get started?",
    answer:
      "No. Ragify is free to start — just create an account and begin uploading. No credit card required.",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[rgba(1,50,252,0.10)] dark:border-[rgba(119,52,231,0.15)] last:border-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4 group"
      >
        <span className="text-[15px] font-semibold text-foreground group-hover:text-[#7734e7] dark:group-hover:text-[#cd79f5] transition-colors duration-150">
          {question}
        </span>
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[rgba(119,52,231,0.10)] dark:bg-[rgba(119,52,231,0.15)] flex items-center justify-center">
          {open ? (
            <Minus className="w-3.5 h-3.5 text-[#7734e7] dark:text-[#cd79f5]" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-[#7734e7] dark:text-[#cd79f5]" />
          )}
        </span>
      </button>
      <div className={`faq-answer ${open ? "open" : ""}`}>
        <div>
          <p className="text-sm text-muted-foreground leading-relaxed pb-5">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FAQSection() {
  return (
    <section id="faq" className="py-24 px-6 bg-background">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#7734e7] dark:text-[#cd79f5]">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2">
            Common Questions
          </h2>
        </div>

        <div className="rounded-2xl border border-[rgba(1,50,252,0.10)] dark:border-[rgba(119,52,231,0.15)] bg-[#fffeff] dark:bg-[#160f2a] px-6 md:px-8">
          {faqs.map((faq) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;
