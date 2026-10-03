import { useEffect, useMemo, useRef, useState } from "react";
import { useMatch, useNavigate } from "react-router-dom";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDeleteConversation,
  useInfiniteConversations,
} from "@/hooks/useConversations";
import { conversationLabel, groupConversations } from "@/lib/conversations";
import type { ConversationListItem } from "@/types/api";
import { ConversationRow } from "./ConversationRow";

interface ConversationHistoryProps {
  /** Called after a chat is chosen, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
}

/**
 * Chat history for the sidebar: grouped by date, loads more as you scroll,
 * with a Load more button as the keyboard and retry path.
 */
export function ConversationHistory({ onNavigate }: ConversationHistoryProps) {
  const navigate = useNavigate();
  const activeId = useMatch("/chat/:conversationId")?.params.conversationId;
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteConversations();
  const deleteConversation = useDeleteConversation();

  const scrollerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [toDelete, setToDelete] = useState<ConversationListItem | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const groups = useMemo(
    () => groupConversations(data?.pages.flat() ?? []),
    [data],
  );

  // Load the next page shortly before the end of the list comes into view.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const scroller = scrollerRef.current;
    if (!sentinel || !scroller || !hasNextPage) return;
    if (isFetchingNextPage || isFetchNextPageError) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { root: scroller, rootMargin: "0px 0px 200px 0px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const confirmDelete = () => {
    if (!toDelete) return;
    const { conversation_id: id } = toDelete;
    setToDelete(null);
    setLeavingId(id);
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (activeId === id) navigate("/chat");
      },
      onSettled: () => setLeavingId(null),
    });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h2 className="px-6 pb-1 pt-3 text-overline text-muted-foreground">
        Chats
      </h2>
      <div
        ref={scrollerRef}
        className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-3"
      >
        {isLoading ? (
          <HistorySkeleton rows={6} />
        ) : isError && groups.length === 0 ? (
          <div className="flex flex-col items-start gap-2 px-3 py-2">
            <p className="text-meta text-muted-foreground">
              Couldn&apos;t load your chats.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="px-3 py-2 text-meta text-muted-foreground">
            No chats yet. Ask a question to start one.
          </p>
        ) : (
          groups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3 className="sticky top-0 z-10 bg-card px-3 pb-1 pt-3 text-overline text-muted-foreground">
                {group.label}
              </h3>
              <ul className="flex flex-col">
                {group.items.map((conversation) => (
                  <ConversationRow
                    key={conversation.conversation_id}
                    conversation={conversation}
                    active={conversation.conversation_id === activeId}
                    collapsing={conversation.conversation_id === leavingId}
                    onNavigate={onNavigate}
                    onDelete={setToDelete}
                  />
                ))}
              </ul>
            </section>
          ))
        )}

        {isFetchingNextPage && <HistorySkeleton rows={3} />}
        {hasNextPage && !isFetchingNextPage && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full text-muted-foreground"
            onClick={() => fetchNextPage()}
          >
            {isFetchNextPageError
              ? "Couldn't load more. Try again"
              : "Load more"}
          </Button>
        )}
        <div ref={sentinelRef} aria-hidden="true" className="h-px" />
      </div>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => !open && setToDelete(null)}
        tone="destructive"
        title="Delete this chat?"
        description={
          toDelete
            ? `“${conversationLabel(toDelete)}” and its messages will be permanently deleted.`
            : undefined
        }
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function HistorySkeleton({ rows }: { rows: number }) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static placeholder rows
        <Skeleton key={i} className="h-7 w-full" />
      ))}
    </div>
  );
}
