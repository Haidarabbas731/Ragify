import { FolderSearch, KeyRound, Link2, LockKeyhole } from "lucide-react";
import { Reveal } from "./Reveal";

const POINTS = [
  {
    icon: Link2,
    title: "Sources on every answer",
    text: "Answers are drawn from your documents and name the ones they used, so you never have to take the AI's word for it.",
  },
  {
    icon: FolderSearch,
    title: "Ask one collection or all",
    text: "Scope a question to a single collection, or search across everything you have uploaded.",
  },
  {
    icon: KeyRound,
    title: "Bring your own model",
    text: "Use the default model, or connect your own Gemini or OpenRouter API key from your profile.",
  },
  {
    icon: LockKeyhole,
    title: "Private to your account",
    text: "Your files are stored for you alone. To answer a question, your question and the relevant excerpts go to the AI provider you use.",
  },
];

export function WhyRagify() {
  return (
    <section id="why-ragify" className="scroll-mt-20 py-20 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="max-w-xl">
          <p className="text-meta font-medium text-primary">Why Ragify</p>
          <h2 className="mt-2 text-display text-foreground">
            Built so you can check the answer
          </h2>
        </Reveal>

        <ul className="mt-12 grid gap-x-12 gap-y-10 sm:grid-cols-2">
          {POINTS.map((point, index) => (
            <li key={point.title}>
              <Reveal delay={(index % 2) * 70}>
                <div className="flex gap-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                    <point.icon className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-section text-foreground">
                      {point.title}
                    </h3>
                    <p className="mt-1.5 text-body text-muted-foreground">
                      {point.text}
                    </p>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
