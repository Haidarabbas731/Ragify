import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CTASection } from "../components/landing/CTASection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { ThreeBackground } from "../components/landing/ThreeBackground";
import { LandingFooter } from "../components/layout/LandingFooter";
import { LandingNav } from "../components/layout/LandingNav";
import { Button } from "../components/ui/button";
import { useDarkMode } from "../hooks/useDarkMode";

gsap.registerPlugin(ScrollTrigger);

export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subheadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { darkMode } = useDarkMode();

  useEffect(() => {
    // Hero entrance animation
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(headlineRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
      })
        .from(
          subheadRef.current,
          {
            y: 60,
            opacity: 0,
            duration: 1,
          },
          "-=0.6",
        )
        .from(
          ctaRef.current?.children || [],
          {
            y: 40,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
          },
          "-=0.5",
        );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 text-slate-900 dark:text-white overflow-hidden transition-colors duration-300">
      <ThreeBackground />

      <LandingNav />

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center px-6 pt-20"
      >
        <div className="max-w-6xl mx-auto text-center z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 dark:border-cyan-400/30 bg-cyan-500/10 dark:bg-cyan-400/5 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
              Powered by Advanced RAG Technology
            </span>
          </div>

          <h1
            ref={headlineRef}
            className="text-6xl md:text-8xl font-bold mb-6 leading-tight text-slate-900 dark:text-white"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span
              key={darkMode ? "dark" : "light"}
              style={{
                background: darkMode
                  ? "linear-gradient(135deg, #fff 0%, #60a5fa 50%, #a78bfa 100%)"
                  : "linear-gradient(135deg, #1e293b 0%, #0ea5e9 50%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Documents,
            </span>
            <br />
            <span className="text-cyan-600 dark:text-cyan-400">
              Supercharged
            </span>{" "}
            with AI
          </h1>

          <p
            ref={subheadRef}
            className="text-xl md:text-2xl text-slate-700 dark:text-slate-200 mb-12 max-w-3xl mx-auto leading-relaxed"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Upload PDFs, Word docs, and text files. Chat with your knowledge
            base using cutting-edge RAG technology. Get intelligent answers with
            source citations.
          </p>

          <div ref={ctaRef} className="flex justify-center">
            <Link to="/register">
              <Button
                size="lg"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 group"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Floating stats */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { label: "Document Formats", value: "4+" },
              { label: "Max File Size", value: "50MB" },
              { label: "Storage Quota", value: "1GB" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-gradient-to-br from-white/80 to-slate-50/80 dark:from-slate-800/50 dark:to-slate-900/50 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/50 hover:border-cyan-500/50 dark:hover:border-cyan-400/50 transition-all duration-300 hover:scale-105 shadow-sm"
              >
                <div className="text-3xl font-bold text-cyan-600 dark:text-cyan-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-700 dark:text-slate-300">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-slate-400/50 flex items-start justify-center p-2">
            <div className="w-1.5 h-3 bg-cyan-600 dark:bg-cyan-400 rounded-full" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Scroll
          </span>
        </div>
      </section>

      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <LandingFooter />
    </div>
  );
}
