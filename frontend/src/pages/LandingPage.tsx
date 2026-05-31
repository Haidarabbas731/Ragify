import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown,
  ArrowRight,
  FileText,
  Folder,
  Github,
  Link,
  Linkedin,
  MessageSquare,
  Share2,
  Twitter,
  Upload,
  Zap,
} from "lucide-react";
import { useEffect, useRef } from "react";
import { FAQSection } from "../components/landing/FAQSection";
import { FeatureCard } from "../components/landing/FeatureCard";
import { StepCard } from "../components/landing/StepCard";
import { LandingNav } from "../components/layout/LandingNav";
import { Button } from "../components/ui/button";
import { useAuthStore } from "../store/authStore";

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const { isAuthenticated } = useAuthStore();
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const ctaSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(headlineRef.current, {
        y: 50,
        opacity: 0,
        duration: 0.9,
        delay: 0.2,
      })
        .from(subheadRef.current, { y: 30, opacity: 0, duration: 0.7 }, "-=0.5")
        .from(
          ctaRef.current?.children || [],
          { y: 20, opacity: 0, duration: 0.5, stagger: 0.12 },
          "-=0.4",
        )
        .from(
          trustRef.current?.children || [],
          { y: 15, opacity: 0, duration: 0.4, stagger: 0.08 },
          "-=0.2",
        );

      gsap.set(featuresRef.current?.querySelectorAll(".feature-card") || [], {
        opacity: 0,
        y: 40,
      });
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 85%",
        onEnter: () => {
          gsap.to(
            featuresRef.current?.querySelectorAll(".feature-card") || [],
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.12,
              ease: "power2.out",
            },
          );
        },
        once: true,
      });

      // Set initial state explicitly so cards are never stuck invisible
      gsap.set(stepsRef.current?.querySelectorAll(".step-card") || [], {
        opacity: 0,
        y: 40,
      });
      ScrollTrigger.create({
        trigger: stepsRef.current,
        start: "top 85%",
        onEnter: () => {
          gsap.to(stepsRef.current?.querySelectorAll(".step-card") || [], {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.15,
            ease: "power2.out",
          });
        },
        once: true,
      });

      gsap.set(ctaSectionRef.current?.children || [], { opacity: 0, y: 30 });
      ScrollTrigger.create({
        trigger: ctaSectionRef.current,
        start: "top 85%",
        onEnter: () => {
          gsap.to(ctaSectionRef.current?.children || [], {
            y: 0,
            opacity: 1,
            duration: 0.7,
            stagger: 0.1,
            ease: "power2.out",
          });
        },
        once: true,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: "RAG-Powered Chat",
      description:
        "Ask questions and get intelligent answers powered by Retrieval-Augmented Generation. Your documents become a conversational knowledge base.",
    },
    {
      icon: FileText,
      title: "Multi-Format Support",
      description:
        "Upload PDFs, Word documents, text files, and Markdown. Up to 50MB per file with intelligent chunking for optimal processing.",
    },
    {
      icon: Folder,
      title: "Smart Collections",
      description:
        "Create collections to organize your documents by topic, project, or category. Keep your knowledge base structured and searchable.",
    },
    {
      icon: Link,
      title: "Source Citations",
      description:
        "Every answer includes citations showing exactly which documents and sections were used. Full transparency in AI responses.",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload Documents",
      description: "Drag and drop your files — PDF, DOCX, TXT, or Markdown.",
    },
    {
      number: "02",
      icon: Zap,
      title: "AI Indexes Everything",
      description:
        "Ragify chunks, embeds, and indexes your documents for semantic search.",
    },
    {
      number: "03",
      icon: MessageSquare,
      title: "Ask in Plain Language",
      description:
        "Ask questions naturally. Get instant answers with source citations.",
    },
    {
      number: "04",
      icon: Share2,
      title: "Organize & Share",
      description:
        "Group documents into collections and collaborate with your team.",
    },
  ];

  const trustItems = [
    "PDF · DOCX · TXT · MD",
    "Up to 50MB per file",
    "Vector search powered",
    "Source citations on every answer",
  ];

  return (
    <div
      ref={heroRef}
      className="relative min-h-screen bg-background text-foreground overflow-x-hidden"
    >
      <LandingNav />

      {/* ── Hero ── */}
      <section
        id="hero"
        className="relative min-h-[88vh] flex flex-col items-center justify-center px-6 pt-24 pb-16 bg-[#12375c]"
      >
        {/* Subtle dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #fffeff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Headline */}
          <h1
            ref={headlineRef}
            className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight text-white mb-6"
          >
            Your Documents, <br className="hidden sm:block" />
            <span className="text-[#cd79f5]">Supercharged</span> with AI
          </h1>

          {/* Subheadline */}
          <p
            ref={subheadRef}
            className="text-lg md:text-xl text-white/70 max-w-xl mx-auto mb-10 leading-relaxed"
          >
            Transform your knowledge base with AI-powered search and chat.
            Instant answers from your documents, with source citations.
          </p>

          {/* CTAs */}
          <div
            ref={ctaRef}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14"
          >
            {isAuthenticated ? (
              <a href="/dashboard">
                <Button
                  size="lg"
                  className="bg-[#7734e7] hover:bg-[#6620d4] text-white rounded-2xl px-8 py-3 text-base font-bold transition-colors duration-150"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </a>
            ) : (
              <>
                <a href="/register">
                  <Button
                    size="lg"
                    className="bg-[#7734e7] hover:bg-[#6620d4] text-white rounded-2xl px-8 py-3 text-base font-bold transition-colors duration-150"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("how-it-works")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="flex items-center gap-2 text-white/65 hover:text-white text-sm font-semibold transition-colors duration-150"
                >
                  See how it works
                  <ArrowDown className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Trust bar */}
          <div
            ref={trustRef}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
          >
            {trustItems.map((item) => (
              <span
                key={item}
                className="text-xs font-semibold text-white/40 uppercase tracking-[1.5px]"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#7734e7] dark:text-[#cd79f5]">
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
              Why Choose Ragify?
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Everything you need to turn documents into an intelligent
              knowledge base
            </p>
          </div>

          <div
            ref={featuresRef}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {features.map((feature) => (
              <div key={feature.title} className="feature-card">
                <FeatureCard {...feature} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-6 bg-muted">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-[2px] text-[#7734e7] dark:text-[#cd79f5]">
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mt-2 mb-3">
              Get Started in 4 Steps
            </h2>
            <p className="text-base text-muted-foreground">
              From documents to intelligent answers in minutes
            </p>
          </div>

          <div
            ref={stepsRef}
            className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6"
          >
            {steps.map((step, index) => (
              <div key={step.number} className="step-card">
                <StepCard {...step} isLast={index === steps.length - 1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <FAQSection />

      {/* ── Bottom CTA ── */}
      <section className="py-24 px-6 bg-[#7734e7]">
        <div ref={ctaSectionRef} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Ready to chat with your documents?
          </h2>
          <p className="text-base text-white/70 mb-10">
            Free to start. No credit card required.
          </p>
          <a href={isAuthenticated ? "/dashboard" : "/register"}>
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 text-[#7734e7] rounded-2xl px-10 py-3 text-base font-bold transition-colors duration-150"
            >
              {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
            </Button>
          </a>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#12375c] py-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="/images/ragify.png"
                  alt="Ragify"
                  className="w-9 h-9"
                />
                <span className="text-white font-bold text-lg">Ragify</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">
                AI-powered document intelligence. Chat with your knowledge base.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Product</h4>
              <ul className="space-y-2.5">
                {["Features", "How It Works", "FAQ"].map((item) => (
                  <li key={item}>
                    <span className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Company</h4>
              <ul className="space-y-2.5">
                {["About", "Blog", "Careers", "Contact"].map((item) => (
                  <li key={item}>
                    <span className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal + Social */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 mb-6">
                {["Privacy Policy", "Terms of Service"].map((item) => (
                  <li key={item}>
                    <span className="text-white/50 hover:text-white/80 text-sm transition-colors cursor-pointer">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-4">
                {(
                  [
                    ["Twitter", Twitter],
                    ["Github", Github],
                    ["Linkedin", Linkedin],
                  ] as const
                ).map(([name, Icon]) => (
                  <button
                    key={name}
                    type="button"
                    className="text-white/40 hover:text-white/80 transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-white/35 text-xs">
              © {new Date().getFullYear()} Ragify. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
