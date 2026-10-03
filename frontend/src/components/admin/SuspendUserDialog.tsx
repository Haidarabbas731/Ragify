import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SuspendUserDialogProps {
  /** Email of the user being suspended; the dialog is open while this is set. */
  email: string | null;
  pending?: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

/** Asks for the reason before suspending an account. */
export function SuspendUserDialog({
  email,
  pending = false,
  onCancel,
  onConfirm,
}: SuspendUserDialogProps) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (email === null) setReason("");
  }, [email]);

  return (
    <Dialog
      open={email !== null}
      onOpenChange={(open) => !open && !pending && onCancel()}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suspend this user?</DialogTitle>
          <DialogDescription>
            <span className="break-all font-medium text-foreground">
              {email}
            </span>{" "}
            will be signed out and unable to log in until you reactivate them.
            Their documents are kept.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Label htmlFor="suspend-reason">Reason</Label>
          <Textarea
            id="suspend-reason"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Recorded in the audit log"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending || !reason.trim()}
            onClick={() => onConfirm(reason.trim())}
          >
            {pending && <Loader2 className="animate-spin" />}
            Suspend user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
