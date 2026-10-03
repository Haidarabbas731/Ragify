import { KeyRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ApiKeyRequiredDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Tells the user chat needs an API key and takes them to where they can add one.
 * Shown when the server has no default key and the user has not saved their own.
 */
export function ApiKeyRequiredDialog({
  open,
  onClose,
}: ApiKeyRequiredDialogProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
            <KeyRound className="size-6" aria-hidden="true" />
          </div>
          <DialogTitle>Add an API key to start chatting</DialogTitle>
          <DialogDescription>
            Chat needs an AI provider key, and none is set up yet. Add your own
            Gemini or OpenRouter key in your profile. It&apos;s stored encrypted
            and only used for your chats.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button variant="outline" onClick={onClose}>
            Not now
          </Button>
          <Button onClick={() => navigate("/profile?tab=model")}>
            Add API key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
