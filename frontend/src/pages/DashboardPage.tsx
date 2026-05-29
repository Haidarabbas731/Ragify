import { FileText, FolderOpen, HardDrive, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DocumentList } from "../components/documents/DocumentList";
import { UploadZone } from "../components/documents/UploadZone";
import { Button } from "../components/ui/button";
import { useDeleteDocument, useDocuments } from "../hooks/useDocuments";
import { useUserStats } from "../hooks/useUserStats";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: statsData, isLoading, error } = useUserStats();
  const { data: recentDocumentsData, refetch: refetchDocuments } = useDocuments(
    {
      page: 1,
      limit: 5,
      sort_by: "uploaded_at",
      order: "desc",
    },
  );

  const deleteDocumentMutation = useDeleteDocument();

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(documentId);
      refetchDocuments();
    } catch {
      // handled by mutation hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm text-destructive mb-4">
            Failed to load dashboard
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const stats = {
    totalDocuments: statsData.total_documents,
    totalChunks: statsData.total_chunks,
    storageUsed: statsData.storage_used_mb,
    storageLimit: statsData.storage_limit_mb,
  };
  const storagePercentage = statsData.storage_percentage;

  return (
    <div className="p-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-2xl p-6 hover:border-[rgba(119,52,231,0.30)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(119,52,231,0.07)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[rgba(119,52,231,0.10)] flex items-center justify-center">
              <FileText className="w-5 h-5 text-[#7734e7] dark:text-[#cd79f5]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
              Documents
            </span>
          </div>
          <p className="text-3xl font-bold font-mono text-[#7734e7] dark:text-[#cd79f5] tabular-nums">
            {stats.totalDocuments}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Total files uploaded
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 hover:border-[rgba(119,52,231,0.30)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(119,52,231,0.07)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[rgba(119,52,231,0.10)] flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-[#7734e7] dark:text-[#cd79f5]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
              Chunks
            </span>
          </div>
          <p className="text-3xl font-bold font-mono text-[#7734e7] dark:text-[#cd79f5] tabular-nums">
            {stats.totalChunks.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Vector embeddings
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 sm:col-span-2 hover:border-[rgba(119,52,231,0.30)] transition-all duration-200 hover:shadow-[0_4px_20px_rgba(119,52,231,0.07)]">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-[rgba(119,52,231,0.10)] flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-[#7734e7] dark:text-[#cd79f5]" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[1.5px] text-muted-foreground">
              Storage
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-3">
            <p className="text-3xl font-bold font-mono text-[#7734e7] dark:text-[#cd79f5] tabular-nums">
              {stats.storageUsed}
            </p>
            <span className="text-base text-muted-foreground">MB</span>
            <span className="text-xs text-muted-foreground">
              / {stats.storageLimit} MB
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                storagePercentage >= 90
                  ? "bg-[#cc4f0e]"
                  : storagePercentage >= 70
                    ? "bg-[#f1a091]"
                    : "bg-[#7734e7]"
              }`}
              style={{ width: `${storagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {storagePercentage < 0.1 && storagePercentage > 0
              ? storagePercentage.toFixed(3)
              : storagePercentage.toFixed(1)}
            % used
            {storagePercentage >= 90 && (
              <span className="text-[#cc4f0e] font-semibold ml-2">
                Nearly full
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-8">
        <UploadZone onUploadComplete={() => refetchDocuments()} />
      </div>

      {/* Recent documents */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-foreground">
            Recent Documents
          </h2>
          <button
            type="button"
            onClick={() => navigate("/documents")}
            className="text-sm font-semibold text-[#7734e7] dark:text-[#cd79f5] hover:underline"
          >
            View All →
          </button>
        </div>
        <DocumentList
          documents={recentDocumentsData?.documents || []}
          onDocumentClick={(id) => navigate(`/documents/${id}`)}
          onDeleteDocument={handleDeleteDocument}
          onRetryDocument={(id) => console.log("Retry document:", id)}
          hideCheckboxes={true}
        />
      </div>
    </div>
  );
}
