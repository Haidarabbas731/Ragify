import { FilePlus2 } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import { AskBar } from "@/components/dashboard/AskBar";
import { AttentionStrip } from "@/components/dashboard/AttentionStrip";
import { CollectionsSummary } from "@/components/dashboard/CollectionsSummary";
import { LibrarySummary } from "@/components/dashboard/LibrarySummary";
import { MobileRecentChats } from "@/components/dashboard/MobileRecentChats";
import { RecentDocuments } from "@/components/dashboard/RecentDocuments";
import type { AppOutletContext } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFirstVisitThisSession } from "@/hooks/useFirstVisitThisSession";
import { useUserStats } from "@/hooks/useUserStats";

/** Rises in on the first visit of a session; plain on every later visit. */
function Enter({
  index,
  animate,
  children,
}: {
  index: number;
  animate: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={animate ? "stagger-in" : undefined}
      style={
        animate ? ({ "--stagger-index": index } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-[88px] w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  );
}

/** Overview: ask a question, see what is indexing, and jump back into documents and collections. */
export function DashboardPage() {
  const { openNewSource } = useOutletContext<AppOutletContext>();
  const { data: stats, isLoading, error, refetch } = useUserStats();
  const firstVisit = useFirstVisitThisSession("dashboard:entered");

  const processing = stats?.documents_by_status.processing ?? 0;
  const failed = stats?.documents_by_status.error ?? 0;

  let content: React.ReactNode;
  if (isLoading) {
    content = <DashboardSkeleton />;
  } else if (error || !stats) {
    content = (
      <ErrorState
        message="Couldn't load your dashboard."
        onRetry={() => refetch()}
      />
    );
  } else if (stats.total_documents === 0 && !processing) {
    content = (
      <EmptyState
        icon={FilePlus2}
        title="Add your first document"
        description="Upload a PDF, Word, text or Markdown file. Once it is indexed you can ask questions and get answers with sources."
        action={<Button onClick={openNewSource}>Upload a document</Button>}
        className="mt-6 py-16"
      />
    );
  } else {
    content = (
      <>
        <Enter index={0} animate={firstVisit}>
          <AskBar />
        </Enter>
        <MobileRecentChats />
        <AttentionStrip processing={processing} failed={failed} />
        <Enter index={1} animate={firstVisit}>
          <LibrarySummary stats={stats} animate={firstVisit} />
        </Enter>
        <Enter index={2} animate={firstVisit}>
          <div className="grid gap-4 lg:grid-cols-3">
            <RecentDocuments />
            <CollectionsSummary />
          </div>
        </Enter>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 sm:p-6">
      {content}
    </div>
  );
}
