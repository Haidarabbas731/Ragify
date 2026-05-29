import { FileText, FolderOpen, HardDrive, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DocumentList } from "../components/documents/DocumentList";
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
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-7 h-7 animate-spin text-[#7733ea] mx-auto mb-3" />
          <p className="text-[13px] text-[#717187]">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  if (error || !statsData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="text-center">
          <p className="text-[13px] text-destructive mb-4">
            Failed to load dashboard
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const storagePercentage = statsData.storage_percentage;

  const kpis = [
    {
      label: "Documents",
      value: statsData.total_documents.toLocaleString(),
      icon: FileText,
      accent: "#7733ea",
    },
    {
      label: "Vector Chunks",
      value: statsData.total_chunks.toLocaleString(),
      icon: FolderOpen,
      accent: "#153bf5",
    },
    {
      label: "Storage Used",
      value: `${statsData.storage_used_mb} MB`,
      icon: HardDrive,
      accent: "#7733ea",
    },
    {
      label: "Storage Left",
      value: `${(statsData.storage_limit_mb - statsData.storage_used_mb).toFixed(0)} MB`,
      icon: HardDrive,
      accent: "#153bf5",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* KPI cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-2xl bg-card border border-border p-5 hover:bg-[rgba(0,51,255,0.02)] transition-colors"
            style={{
              boxShadow:
                "0 1px 2px rgba(34,38,96,0.04), 0 8px 24px -12px rgba(34,38,96,0.08)",
            }}
          >
            <div className="text-[12px] font-semibold text-[#717187] mb-2">
              {kpi.label}
            </div>
            <div className="flex items-end justify-between gap-2">
              <div
                className="text-[28px] font-bold tracking-tight tabular-nums"
                style={{ color: kpi.accent }}
              >
                {kpi.value}
              </div>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mb-0.5"
                style={{ background: `${kpi.accent}14` }}
              >
                <kpi.icon className="w-4 h-4" style={{ color: kpi.accent }} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Storage bar */}
      {storagePercentage > 0 && (
        <div
          className="rounded-2xl bg-card border border-border p-5"
          style={{
            boxShadow:
              "0 1px 2px rgba(34,38,96,0.04), 0 8px 24px -12px rgba(34,38,96,0.08)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-[14px] font-semibold text-[#222660]">
                Storage
              </h3>
              <p className="text-[12px] text-[#717187] mt-0.5">
                {statsData.storage_used_mb} MB used of{" "}
                {statsData.storage_limit_mb} MB
              </p>
            </div>
            <span
              className={`text-[12px] font-semibold px-2.5 py-1 rounded-lg ${
                storagePercentage >= 90
                  ? "bg-[rgba(204,79,14,0.10)] text-[#cc4f0e]"
                  : "bg-[rgba(0,51,255,0.06)] text-[#153bf5]"
              }`}
            >
              {storagePercentage.toFixed(1)}% used
              {storagePercentage >= 90 && " · Nearly full"}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[rgba(34,38,96,0.06)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(storagePercentage, 100)}%`,
                background:
                  storagePercentage >= 90
                    ? "#cc4f0e"
                    : "linear-gradient(90deg, #7733ea, #153bf5)",
              }}
            />
          </div>
        </div>
      )}

      {/* Recent Documents */}
      <div
        className="rounded-2xl bg-card border border-border overflow-hidden"
        style={{
          boxShadow:
            "0 1px 2px rgba(34,38,96,0.04), 0 8px 24px -12px rgba(34,38,96,0.08)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="text-[14px] font-semibold text-[#222660]">
              Recent Documents
            </h3>
            <p className="text-[12px] text-[#717187] mt-0.5">
              Last 5 uploaded files
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/documents")}
            className="text-[12px] font-semibold text-[#7733ea] hover:underline"
          >
            View all →
          </button>
        </div>

        <div className="px-5 py-2">
          <DocumentList
            documents={recentDocumentsData?.documents || []}
            onDocumentClick={(id) => navigate(`/documents/${id}`)}
            onDeleteDocument={handleDeleteDocument}
            onRetryDocument={(id) => console.log("Retry document:", id)}
            hideCheckboxes={true}
          />
        </div>
      </div>
    </div>
  );
}
