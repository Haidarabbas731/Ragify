import { KeyRound } from "lucide-react";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

interface ApiKeyRequiredDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Tells the user chat needs an API key and takes them to where they can add one.
 *
 * Shown when the server has no default key and the user has not saved their own.
 * Built on the native <dialog>, which provides the focus trap, Escape to close and the
 * modal backdrop.
 */
export function ApiKeyRequiredDialog({
  open,
  onClose,
}: ApiKeyRequiredDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="api-key-dialog-title"
      className="m-auto w-full max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-2xl backdrop:bg-slate-900/60 backdrop:backdrop-blur-sm dark:backdrop:bg-slate-950/80"
    >
      <div className="animate-in fade-in zoom-in-95 duration-200 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2
          id="api-key-dialog-title"
          className="mb-2 text-xl font-bold font-sans"
        >
          Add an API key to start chatting
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground font-sans">
          Chat needs an AI provider key, and none is set up yet. Add your own
          Gemini or OpenRouter key in your profile. It's stored encrypted and
          only used for your chats.
        </p>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Not now
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => navigate("/profile?tab=preferences")}
          >
            Add API key
          </Button>
        </div>
      </div>
    </dialog>
  );
}
