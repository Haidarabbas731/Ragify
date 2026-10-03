import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { Reveal } from "./Reveal";

export function FinalCta() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="py-20 sm:py-24">
      <Reveal className="mx-auto w-full max-w-3xl px-6">
        <div className="flex flex-col items-center gap-5 rounded-3xl border border-border bg-card px-6 py-14 text-center shadow-[var(--ragify-shadow)]">
          <h2 className="text-display text-foreground">
            Ask your first question
          </h2>
          <p className="max-w-md text-body text-muted-foreground">
            Upload a file, ask about it, and see the passage the answer came
            from.
          </p>
          <Button asChild size="lg">
            <Link to={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Go to dashboard" : "Create account"}
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
