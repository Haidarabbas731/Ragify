import { cn } from "@/lib/utils";

interface LogoProps {
  /** Rendered width and height in pixels. */
  size?: number;
  className?: string;
}

/** The Ragify mark. The single place that knows the logo's image path. */
export function Logo({ size = 36, className }: LogoProps) {
  return (
    <img
      src="/images/ragify.png"
      alt="Ragify"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
    />
  );
}
