import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Key } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/button";

gsap.registerPlugin(ScrollTrigger);

export function CTASection() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax effect
      gsap.to(contentRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
        },
        y: -50,
        ease: "none",
      });

      // Fade in animation
      gsap.from(contentRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          toggleActions: "play none none reverse",
        },
        opacity: 0,
        scale: 0.95,
        duration: 1,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-6 z-10">
      <div className="max-w-5xl mx-auto">
        <div
          ref={contentRef}
          className="relative p-12 md:p-20 rounded-3xl overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-purple-600/20 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/50 via-transparent to-slate-900/50" />

          {/* Animated border */}
          <div className="absolute inset-0 rounded-3xl border-2 border-cyan-400/30" />

          {/* Content */}
          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 backdrop-blur-sm mb-8">
              <Key className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">
                Invite-Only Access
              </span>
            </div>

            <h2
              className="text-4xl md:text-6xl font-bold mb-6"
              style={{
                fontFamily: "'Playfair Display', serif",
                background: "linear-gradient(135deg, #fff 0%, #22d3ee 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Ready to Transform
              <br />
              Your Knowledge?
            </h2>

            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join with an invite code and start chatting with your documents
              today. Experience the future of knowledge management.
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 py-7 text-lg font-semibold rounded-full shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 group"
                >
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            <p className="text-sm text-slate-400 mt-6">
              Need an invite code?{" "}
              <a
                href="mailto:support@example.com"
                className="text-cyan-400 hover:text-cyan-300 transition-colors underline"
              >
                Contact us
              </a>
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-4 w-32 h-32 bg-gradient-to-tr from-purple-400/10 to-transparent rounded-full blur-2xl" />
        </div>
      </div>
    </section>
  );
}
