import { FolderPlus } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  useCreateCollection,
  useDeleteCollection,
  useUpdateCollection,
} from "@/hooks/useCollections";
import type { Collection } from "@/types/api";
import { CollectionCard } from "./CollectionCard";
import {
  CollectionFormDialog,
  type CollectionFormValues,
} from "./CollectionFormDialog";

interface CollectionGridProps {
  collections: Collection[];
  /** Open the create dialog; owned by the page so its header button shares it. */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

/** Collection cards with the edit, create and delete dialogs they open. */
export function CollectionGrid({
  collections,
  createOpen,
  onCreateOpenChange,
}: CollectionGridProps) {
  const [editing, setEditing] = useState<Collection | null>(null);
  const [deleting, setDeleting] = useState<Collection | null>(null);
  const create = useCreateCollection();
  const update = useUpdateCollection();
  const remove = useDeleteCollection();

  // Cards present on first paint stagger in; cards added later just fade in.
  const initialIds = useRef(
    new Set(collections.map((collection) => collection.collection_id)),
  );

  const handleCreate = (values: CollectionFormValues) =>
    create.mutate(
      { name: values.name, description: values.description || undefined },
      { onSuccess: () => onCreateOpenChange(false) },
    );

  const handleUpdate = (values: CollectionFormValues) => {
    if (!editing) return;
    update.mutate(
      {
        collectionId: editing.collection_id,
        updates: { name: values.name, description: values.description },
      },
      { onSuccess: () => setEditing(null) },
    );
  };

  const handleDelete = () => {
    if (!deleting) return;
    remove.mutate(deleting.collection_id, {
      onSuccess: () => setDeleting(null),
    });
  };

  return (
    <>
      {collections.length === 0 ? (
        <EmptyState
          icon={FolderPlus}
          title="No collections yet"
          description="Collections group related documents so you can filter and chat with them together."
          action={
            <Button onClick={() => onCreateOpenChange(true)}>
              New collection
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection, index) => (
            <CollectionCard
              key={collection.collection_id}
              collection={collection}
              staggerIndex={
                initialIds.current.has(collection.collection_id)
                  ? index
                  : undefined
              }
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ))}
        </ul>
      )}

      <CollectionFormDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        pending={create.isPending}
        onSubmit={handleCreate}
      />

      <CollectionFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        initialValues={
          editing
            ? { name: editing.name, description: editing.description }
            : undefined
        }
        pending={update.isPending}
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        tone="destructive"
        title={deleting ? `Delete “${deleting.name}”?` : "Delete collection?"}
        description={
          deleting && deleting.document_count > 0
            ? `${deleting.document_count} ${deleting.document_count === 1 ? "document stays" : "documents stay"} in your library without a collection. Only the collection is removed.`
            : "The collection is removed. Your documents are not affected."
        }
        confirmLabel="Delete collection"
        pending={remove.isPending}
        onConfirm={handleDelete}
      />
    </>
  );
}
