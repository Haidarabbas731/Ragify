import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { CollectionSelect } from "@/components/shared/CollectionSelect";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCollections } from "@/hooks/useCollections";
import type { Document } from "@/types/api";

export interface DocumentMetadata {
  collection_id: string | null;
  category: string | null;
  tags: string[];
}

interface EditMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  pending?: boolean;
  onSave: (metadata: DocumentMetadata) => void;
}

/** Edit a document's collection, category and tags. */
export function EditMetadataDialog({
  open,
  onOpenChange,
  document,
  pending = false,
  onSave,
}: EditMetadataDialogProps) {
  const { data } = useCollections();
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");

  // Start from the document's current values every time the dialog opens
  useEffect(() => {
    if (!open) return;
    setCollectionId(document.collection_id);
    setCategory(document.category ?? "");
    setTags(document.tags?.join(", ") ?? "");
  }, [open, document]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      collection_id: collectionId,
      category: category.trim() || null,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit details</DialogTitle>
          <DialogDescription>
            Change the collection, category and tags for this document.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Collection</Label>
            <CollectionSelect
              collections={data?.collections ?? []}
              value={collectionId}
              onChange={setCollectionId}
              allLabel="No collection"
              className="w-full"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-category">Category</Label>
            <Input
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. financial, technical, research"
              autoComplete="off"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-tags">Tags</Label>
            <Input
              id="edit-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Separate with commas: design, q1, report"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
