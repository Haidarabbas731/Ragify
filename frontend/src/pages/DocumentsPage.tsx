/**
 * Documents Page - Archive Command Center
 * Full-page document management interface with terminal aesthetic
 * Fonts: JetBrains Mono (monospace), Space Grotesk (headings)
 */

import {
  ArrowLeft,
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Sun,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BatchActions } from "../components/documents/BatchActions";
import { BatchDeleteDialog } from "../components/documents/BatchDeleteDialog";
import { DocumentList } from "../components/documents/DocumentList";
import {
  type FilterState,
  SearchFilter,
} from "../components/documents/SearchFilter";
import { Button } from "../components/ui/button";
import { useDarkMode } from "../contexts/DarkModeContext";
import {
  useBatchDeleteDocuments,
  useDeleteAllDocuments,
  useDeleteDocument,
  useDocuments,
  useRetryDocument,
  useUpdateDocument,
} from "../hooks/useDocuments";
import { useAuthStore } from "../store/authStore";

export function DocumentsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    collectionId: null,
    statusFilter: null,
    sortBy: "created_at",
    order: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch documents with filters
  const {
    data: documentsData,
    isLoading,
    error,
  } = useDocuments({
    page: currentPage,
    limit: 50,
    collection_id: filters.collectionId || undefined,
    status_filter:
      (filters.statusFilter as
        | "processing"
        | "active"
        | "error"
        | "deleted"
        | undefined) || undefined,
    sort_by: filters.sortBy,
    order: filters.order,
  });

  // API mutations
  const deleteDocumentMutation = useDeleteDocument();
  const retryDocumentMutation = useRetryDocument();
  const batchDeleteMutation = useBatchDeleteDocuments();
  const deleteAllMutation = useDeleteAllDocuments();
  const updateDocumentMutation = useUpdateDocument();

  // Mock collections data - TODO: Replace with actual collections API call
  const mockCollections = [
    { collection_id: "coll_1", name: "Research Papers" },
    { collection_id: "coll_2", name: "Meeting Notes" },
    { collection_id: "coll_3", name: "Technical Docs" },
  ];

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Batch operations state
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set(),
  );
  const [batchDeleteDialog, setBatchDeleteDialog] = useState(false);

  const totalDocuments = documentsData?.total || 0;

  const handleSelectionChange = (documentId: string, selected: boolean) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (documentsData?.documents) {
      const allDocIds = documentsData.documents.map((doc) => doc.document_id);
      setSelectedDocuments(new Set(allDocIds));
    }
  };

  const handleDeselectAll = () => {
    setSelectedDocuments(new Set());
  };

  const handleBatchDelete = () => {
    setBatchDeleteDialog(true);
  };

  const handleConfirmBatchDelete = async () => {
    const isAllSelected = selectedDocuments.size === totalDocuments;

    if (isAllSelected) {
      // All documents selected - use delete-all endpoint
      await deleteAllMutation.mutateAsync();
    } else {
      // Partial selection - use batch-delete endpoint
      await batchDeleteMutation.mutateAsync({
        document_ids: Array.from(selectedDocuments),
      });
    }

    setSelectedDocuments(new Set());
    setBatchDeleteDialog(false);
  };

  const handleMoveToCollection = async (collectionId: string) => {
    // Update all selected documents to new collection
    const updatePromises = Array.from(selectedDocuments).map((documentId) =>
      updateDocumentMutation.mutateAsync({
        documentId,
        updates: { collection_id: collectionId },
      }),
    );

    await Promise.all(updatePromises);
    setSelectedDocuments(new Set());
  };

  // Initialize and get dark mode state
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-emerald-50 dark:bg-slate-950 relative">
      {/* Scan-line overlay effect */}
      <div
        className="pointer-events-none fixed inset-0 z-50 opacity-[0.02] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34, 197, 94, 0.3) 2px, rgba(34, 197, 94, 0.3) 4px)",
          animation: "scanline 8s linear infinite",
        }}
      />

      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-emerald-200 dark:border-emerald-900/30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Menu className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            )}
          </button>

          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-105 relative">
              <FileText className="w-6 h-6 text-white" />
              <div className="absolute inset-0 bg-emerald-400/20 animate-pulse rounded-sm" />
            </div>
            <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-['Space_Grotesk'] tracking-tight">
              ARCHIVE{"/"}
              {"/"}/SYS
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle - Hidden on mobile (in sidebar instead) */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="hidden lg:flex p-2 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Moon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/30">
              <User className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <span className="text-sm font-mono text-emerald-800 dark:text-emerald-300">
                {user?.email}
              </span>
            </div>

            {/* Logout Button - Hidden on mobile (in sidebar instead) */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hidden lg:flex gap-2 border-red-300 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-400 dark:hover:border-red-700 transition-all duration-300 font-mono font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 dark:bg-black/80 backdrop-blur-sm z-30 lg:hidden cursor-default"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileMenuOpen(false);
          }}
          aria-label="Close menu"
        />
      )}

      {/* Mobile Menu Drawer */}
      <aside
        className={`fixed top-[73px] left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-emerald-200 dark:border-emerald-900/30 z-40 lg:hidden transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
            >
              <HardDrive className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/documents"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 font-bold font-mono transition-all hover:scale-[1.02] border border-emerald-300 dark:border-emerald-900/50"
            >
              <FileText className="w-5 h-5" />
              <span>All Documents</span>
            </Link>
            <Link
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <Link
              to="/collections"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Collections</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-emerald-200 dark:border-emerald-900/30 bg-white/50 dark:bg-slate-900/50 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
              >
                <HardDrive className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-400 font-bold font-mono transition-all hover:scale-[1.02] border border-emerald-300 dark:border-emerald-900/50">
                <FileText className="w-5 h-5" />
                <span>All Documents</span>
              </div>
              <Link
                to="/chat"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link
                to="/collections"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 font-mono transition-all hover:scale-[1.02]"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Collections</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                size="sm"
                className="gap-2 border-emerald-300 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/30 hover:border-emerald-400 dark:hover:border-emerald-700 font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">BACK</span>
              </Button>
              <div className="h-px flex-1 bg-gradient-to-r from-emerald-300 dark:from-emerald-900/50 via-emerald-200 dark:via-emerald-700/30 to-transparent" />
            </div>

            <h1 className="text-4xl font-bold text-emerald-700 dark:text-emerald-400 font-['Space_Grotesk'] tracking-tight mb-2">
              DOCUMENT ARCHIVE
            </h1>
            <p className="text-emerald-600 dark:text-emerald-300/70 font-mono text-sm">
              {">"} Full system catalog {"/"}
              {"/"} All files indexed
            </p>
          </div>

          {/* Search & Filter */}
          <SearchFilter
            collections={mockCollections}
            onFilterChange={handleFilterChange}
          />

          {/* Batch Operations - Only show when documents are selected */}
          {selectedDocuments.size > 0 && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <BatchActions
                selectedCount={selectedDocuments.size}
                totalCount={totalDocuments}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onBatchDelete={handleBatchDelete}
                onMoveToCollection={handleMoveToCollection}
                collections={mockCollections}
              />
            </div>
          )}

          {/* Document List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-950/20 p-6 text-center">
              <p className="text-red-600 dark:text-red-400 font-mono">
                Failed to load documents. Please try again.
              </p>
            </div>
          ) : (
            <DocumentList
              documents={documentsData?.documents || []}
              onDocumentClick={(docId) => {
                navigate(`/documents/${docId}`);
              }}
              onDeleteDocument={(docId) => {
                deleteDocumentMutation.mutate(docId);
              }}
              onRetryDocument={(docId) => {
                retryDocumentMutation.mutate(docId);
              }}
              selectedDocuments={selectedDocuments}
              onSelectionChange={handleSelectionChange}
            />
          )}
        </main>
      </div>

      {/* Batch Delete Confirmation Dialog - Smart dialog that shows different messages based on selection */}
      <BatchDeleteDialog
        isOpen={batchDeleteDialog}
        selectedCount={selectedDocuments.size}
        totalCount={totalDocuments}
        onConfirm={handleConfirmBatchDelete}
        onCancel={() => setBatchDeleteDialog(false)}
      />

      {/* Animations */}
      <style>{`
        @keyframes scanline {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100%);
          }
        }
      `}</style>
    </div>
  );
}
