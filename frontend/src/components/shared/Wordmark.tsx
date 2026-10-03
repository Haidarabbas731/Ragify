import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";

interface WordmarkProps {
  /** Where the mark links to. */
  to?: string;
}

/** The Ragify mark with its name, linking home. Used on pages outside the app shell. */
export function Wordmark({ to = "/" }: WordmarkProps) {
  return (
    <Link to={to} className="flex w-fit items-center gap-3">
      <Logo size={52} />
      <span className="text-display text-foreground">Ragify</span>
    </Link>
  );
}
