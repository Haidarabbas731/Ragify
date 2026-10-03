import { type ReactNode, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Extra delay in ms, for staggering siblings. */
  delay?: number;
}

/**
 * Eases a block in the first time it scrolls into view. Content is visible by default, so
 * nothing is lost without scripts; only blocks that start below the fold are hidden, and
 * reduced motion turns the rise into a plain fade.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    // Already on screen when the page loads: leave it alone
    if (element.getBoundingClientRect().top < window.innerHeight * 0.9) return;

    setHidden(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHidden(false);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-hidden={hidden}
      className={cn("reveal", className)}
      style={delay ? { ["--reveal-delay" as string]: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
