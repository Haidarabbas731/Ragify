import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  FileText,
  Folder,
  Link as LinkIcon,
  MessageSquare,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { useDarkMode } from "../../hooks/useDarkMode";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: MessageSquare,
    title: "RAG-Powered Chat",
    description:
      "Ask questions and get intelligent answers powered by Retrieval-Augmented Generation. Your documents become a conversational knowledge base.",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    icon: FileText,
    title: "Multi-Format Support",
    description:
      "Upload PDFs, Word documents, text files, and Markdown. Up to 50MB per file with intelligent chunking for optimal processing.",
    gradient: "from-blue-500 to-purple-600",
  },
  {
    icon: Folder,
    title: "Smart Organization",
    description:
      "Create collections to organize your documents by topic, project, or category. Keep your knowledge base structured and searchable.",
    gradient: "from-purple-500 to-pink-600",
  },
  {
    icon: LinkIcon,
    title: "Source Citations",
    description:
      "Every answer includes citations showing exactly which documents and sections were used. Full transparency in AI responses.",
    gradient: "from-pink-500 to-rose-600",
  },
];

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate cards on scroll
      const cards = cardsRef.current?.children || [];

      gsap.fromTo(
        cards,
        {
          y: 100,
          opacity: 0,
        },
        {
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.2,
          ease: "power3.out",
        },
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-20 px-6 z-10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            key={darkMode ? "dark" : "light"}
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: darkMode
                ? "linear-gradient(135deg, #fff 0%, #60a5fa 100%)"
                : "linear-gradient(135deg, #1e293b 0%, #0ea5e9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Powerful Features
          </h2>
          <p className="text-xl text-slate-700 dark:text-slate-300 max-w-2xl mx-auto">
            Everything you need to transform your documents into an intelligent,
            conversational knowledge base
          </p>
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative p-8 rounded-3xl bg-gradient-to-br from-white/90 to-slate-50/90 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/50 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 transition-all duration-500 hover:scale-105 hover:-translate-y-2 shadow-md hover:shadow-xl"
              >
                {/* Gradient glow effect */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`}
                />

                <div className="relative z-10">
                  <div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Decorative corner accent */}
                <div className="absolute top-4 right-4 w-20 h-20 border-t-2 border-r-2 border-cyan-500/20 dark:border-cyan-400/20 rounded-tr-2xl group-hover:border-cyan-600/50 dark:group-hover:border-cyan-400/50 transition-colors" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
