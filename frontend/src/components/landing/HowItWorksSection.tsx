import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MessageCircle, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Documents",
    description:
      "Upload your PDFs, Word docs, text files, or Markdown. Our system processes and chunks them intelligently for optimal retrieval.",
  },
  {
    number: "02",
    icon: MessageCircle,
    title: "Ask Questions",
    description:
      "Chat naturally with your knowledge base. Ask questions, request summaries, or explore connections across your documents.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Get Intelligent Answers",
    description:
      "Receive AI-powered responses with source citations. Every answer shows exactly where the information came from.",
  },
];

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const linesRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animate steps
      const stepElements = stepsRef.current?.children || [];

      gsap.from(stepElements, {
        scrollTrigger: {
          trigger: stepsRef.current,
          start: "top 75%",
          end: "bottom 25%",
          toggleActions: "play none none reverse",
        },
        x: -100,
        opacity: 0,
        duration: 1,
        stagger: 0.3,
        ease: "power3.out",
      });

      // Animate connecting lines
      if (linesRef.current) {
        const paths = linesRef.current.querySelectorAll("path");
        paths.forEach((path) => {
          const length = path.getTotalLength();
          gsap.set(path, {
            strokeDasharray: length,
            strokeDashoffset: length,
          });

          gsap.to(path, {
            scrollTrigger: {
              trigger: stepsRef.current,
              start: "top 75%",
              end: "bottom 25%",
              toggleActions: "play none none reverse",
            },
            strokeDashoffset: 0,
            duration: 2,
            ease: "power2.inOut",
          });
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="relative py-32 px-6 z-10"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2
            className="text-5xl md:text-6xl font-bold mb-6"
            style={{
              fontFamily: "'Playfair Display', serif",
              background: "linear-gradient(135deg, #fff 0%, #a78bfa 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            How It Works
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Three simple steps to transform your documents into an AI-powered
            knowledge base
          </p>
        </div>

        <div className="relative">
          {/* Connecting lines (desktop only) */}
          <svg
            ref={linesRef}
            className="absolute top-0 left-0 w-full h-full hidden md:block pointer-events-none"
            style={{ zIndex: 0 }}
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="lineGradient1"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient
                id="lineGradient2"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path
              d="M 33% 20% Q 50% 10%, 66% 20%"
              fill="none"
              stroke="url(#lineGradient1)"
              strokeWidth="2"
            />
            <path
              d="M 66% 20% Q 83% 30%, 100% 20%"
              fill="none"
              stroke="url(#lineGradient2)"
              strokeWidth="2"
            />
          </svg>

          <div
            ref={stepsRef}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10"
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.title} className="relative">
                  <div className="text-center">
                    {/* Step number */}
                    <div className="text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-400/20 to-blue-600/20 mb-6">
                      {step.number}
                    </div>

                    {/* Icon */}
                    <div className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-2 border-cyan-400/30 backdrop-blur-sm mb-6 hover:scale-110 transition-transform duration-300">
                      <Icon className="w-12 h-12 text-cyan-400" />
                    </div>

                    {/* Content */}
                    <h3 className="text-2xl font-bold mb-4 text-white">
                      {step.title}
                    </h3>
                    <p className="text-slate-400 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Decorative dots */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-400/30" />
                    <div
                      className="w-2 h-2 rounded-full bg-cyan-400/30"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-cyan-400/30"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
