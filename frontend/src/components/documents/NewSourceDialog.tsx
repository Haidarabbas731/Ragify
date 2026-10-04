import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UploadZone } from "./UploadZone";

interface NewSourceDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after an upload batch finishes, so lists and storage can refresh. */
  onUploadComplete?: () => void;
}

/** Dialog for adding documents: drop or browse files, choose a collection, upload. */
export function NewSourceDialog({
  open,
  onClose,
  onUploadComplete,
}: NewSourceDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New source</DialogTitle>
          <DialogDescription>
            Add files to your knowledge base. They are indexed so you can ask
            questions about them.
          </DialogDescription>
        </DialogHeader>
        <UploadZone
          onUploadComplete={({ succeeded, failed }) => {
            onUploadComplete?.();
            // Close once everything is in; keep it open so failures can be retried.
            if (succeeded > 0 && failed === 0) onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
