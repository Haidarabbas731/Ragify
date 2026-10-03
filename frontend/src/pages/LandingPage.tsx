import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FAQSection } from "@/components/landing/FAQSection";
import { FinalCta } from "@/components/landing/FinalCta";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import { WhyRagify } from "@/components/landing/WhyRagify";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

/** The public front page: what Ragify does, shown with one cited answer. */
export function LandingPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Anchor links scroll smoothly on this page only (and not for reduced motion)
  useEffect(() => {
    const root = document.documentElement;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.style.scrollBehavior = "smooth";
    }
    return () => {
      root.style.scrollBehavior = "";
    };
  }, []);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingNav />

      <main>
        <section className="pt-28 pb-20 sm:pt-32 sm:pb-24">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
            <div className="fade-in-soft flex flex-col items-start gap-6">
              <h1 className="text-[clamp(2.5rem,6vw,4.25rem)] font-bold leading-[1.05] tracking-[-0.03em] text-foreground">
                Ask your documents. See exactly where the answer came from.
              </h1>
              <p className="max-w-xl text-lg text-muted-foreground">
                Upload PDFs, Word, text or Markdown files. Ragify finds the
                passages that matter and answers from them, with the source on
                every answer.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {isAuthenticated ? (
                  <Button asChild size="lg">
                    <Link to="/dashboard">
                      Go to dashboard <ArrowRight />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild size="lg">
                      <Link to="/register">
                        Create account <ArrowRight />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline">
                      <Link to="/login">Sign in</Link>
                    </Button>
                  </>
                )}
              </div>
              <p className="text-meta text-muted-foreground">
                Works with PDF, DOCX, TXT and Markdown files.
              </p>
            </div>

            <HeroDemo />
          </div>
        </section>

        <HowItWorks />
        <WhyRagify />
        <FAQSection />
        <FinalCta />
      </main>

      <LandingFooter />
    </div>
  );
}
