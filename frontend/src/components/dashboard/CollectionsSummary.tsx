import { FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollections } from "@/hooks/useCollections";

const MAX_SHOWN = 5;

/** The largest collections, each linking to its documents. */
export function CollectionsSummary() {
  const { data, isLoading } = useCollections();
  const top = [...(data?.collections ?? [])]
    .sort((a, b) => b.document_count - a.document_count)
    .slice(0, MAX_SHOWN);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Collections</CardTitle>
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/collections">Manage</Link>
        </Button>
      </CardHeader>

      <div className="px-3 pb-3">
        {isLoading ? (
          <div className="flex flex-col gap-2 px-2 pb-2" aria-busy="true">
            {Array.from({ length: 3 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : top.length === 0 ? (
          <p className="px-2 pb-2 text-body text-muted-foreground">
            No collections yet.{" "}
            <Link to="/collections" className="text-primary hover:underline">
              Create one
            </Link>{" "}
            to group related documents.
          </p>
        ) : (
          <ul className="flex flex-col">
            {top.map((collection) => (
              <li key={collection.collection_id}>
                <Link
                  to={`/documents?collection=${collection.collection_id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 text-body transition-colors duration-150 ease-snap hover:bg-accent"
                >
                  <FolderOpen
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {collection.name}
                  </span>
                  <span className="text-meta tabular-nums text-muted-foreground">
                    {collection.document_count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
