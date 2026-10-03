import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The cited passage: sweeps yellow once `active`, the signature of every Ragify answer. */
export function CitedText({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <mark
      className={cn(
        "rounded-sm bg-transparent bg-no-repeat px-0.5 text-inherit",
        active && "text-highlight-foreground",
      )}
      style={{
        backgroundImage: "linear-gradient(var(--highlight), var(--highlight))",
        backgroundSize: active ? "100% 100%" : "0% 100%",
        // The text turns dark only once the yellow has mostly covered it
        transition:
          "background-size 500ms var(--ease-out), color 200ms ease 300ms",
      }}
    >
      {children}
    </mark>
  );
}
