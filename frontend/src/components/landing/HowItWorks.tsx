import { FileUp, MessageSquareText, ScanSearch } from "lucide-react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    icon: FileUp,
    title: "Upload your files",
    text: "Drop in PDF, Word, text or Markdown files. Group them into collections if you like.",
  },
  {
    icon: ScanSearch,
    title: "Ragify reads them",
    text: "Each file is split into passages you can search by meaning, not just by matching words.",
  },
  {
    icon: MessageSquareText,
    title: "Ask, then check",
    text: "Ask in plain language. Every answer lists the documents it used, so you can open them and verify.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 border-y border-border bg-muted/40 py-20 sm:py-24"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="max-w-xl">
          <p className="text-meta font-medium text-primary">How it works</p>
          <h2 className="mt-2 text-display text-foreground">
            From a file to a cited answer in three steps
          </h2>
        </Reveal>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title}>
              <Reveal delay={index * 70} className="h-full">
                <div className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-[var(--ragify-shadow)]">
                  <div className="flex items-center justify-between">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <step.icon className="size-5" aria-hidden="true" />
                    </div>
                    <span className="text-stat tabular-nums text-muted-foreground/60">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="text-section text-foreground">{step.title}</h3>
                  <p className="text-body text-muted-foreground">{step.text}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
