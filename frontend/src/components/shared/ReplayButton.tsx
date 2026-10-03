import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReplayButtonProps {
  onClick: () => void;
  /** Shown once the animation has finished; hidden (but not removed) while it plays. */
  visible: boolean;
}

/** Small "Replay" control under an animated demo. */
export function ReplayButton({ onClick, visible }: ReplayButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!visible}
      tabIndex={visible ? 0 : -1}
      className={cn(
        "ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 text-meta text-muted-foreground transition-[color,opacity] duration-150 ease-snap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [@media(hover:hover)and(pointer:fine)]:hover:text-foreground",
        !visible && "pointer-events-none opacity-0",
      )}
    >
      <RotateCcw className="size-3.5" aria-hidden="true" />
      Replay
    </button>
  );
}
