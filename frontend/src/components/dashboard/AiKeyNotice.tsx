import { KeyRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAiSettings } from "@/hooks/useAiSettings";

/**
 * Chat runs on the user's own Gemini or OpenRouter key (the server has none), so a new account
 * cannot chat until one is saved. Shown above the dashboard until a key exists.
 */
export function AiKeyNotice() {
  const { data } = useAiSettings();
  if (!data || data.has_key) return null;

  return (
    <output className="fade-in-soft flex items-center gap-3 rounded-xl border border-info/25 bg-info/10 px-4 py-3 text-body text-foreground">
      <KeyRound className="size-4 shrink-0 text-info" aria-hidden="true" />
      <span className="flex-1">
        Add your AI key to start chatting. Ragify uses your own Gemini or
        OpenRouter key.
      </span>
      <Link
        to="/profile?tab=model"
        className="shrink-0 font-medium text-primary underline underline-offset-2"
      >
        Add key
      </Link>
    </output>
  );
}
