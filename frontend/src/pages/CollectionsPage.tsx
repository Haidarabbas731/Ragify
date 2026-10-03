import { Plus } from "lucide-react";
import { useState } from "react";
import { CollectionGrid } from "@/components/collections/CollectionGrid";
import { ErrorState } from "@/components/shared/ErrorState";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/useCollections";
import { getApiErrorMessage } from "@/lib/errors";

export function CollectionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, isError, error, refetch } = useCollections();
  const collections = data?.collections ?? [];

  const summary = data
    ? `${collections.length} ${collections.length === 1 ? "collection" : "collections"} · ${data.total_documents} ${data.total_documents === 1 ? "document" : "documents"}`
    : "Group related documents so you can filter and chat with them together.";

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        description={summary}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New collection
          </Button>
        }
      />

      {isLoading ? (
        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          aria-busy="true"
        >
          {Array.from({ length: 3 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder cards
            <Skeleton key={i} className="h-[178px] rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={getApiErrorMessage(error, "Could not load collections.")}
          onRetry={() => refetch()}
        />
      ) : (
        <CollectionGrid
          collections={collections}
          createOpen={createOpen}
          onCreateOpenChange={setCreateOpen}
        />
      )}
    </div>
  );
}
