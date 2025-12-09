/**
 * Documents Page - Archive Command Center
 * Full-page document management interface with clean design
 * Fonts: Geist (sans), Geist Mono (mono)
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
import { useCollections } from "../hooks/useCollections";
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
    search: filters.searchTerm || undefined,
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

  // Fetch collections from backend
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.collections || [];

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
    <div className="min-h-screen bg-background relative">
      {/* Grid background */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04] dark:opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--muted) / 0.1) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--muted) / 0.1) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-primary" />
            )}
          </button>

          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary font-sans tracking-tight">
              ARCHIVE{"/"}
              {"/"}SYS
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle - Hidden on mobile (in sidebar instead) */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="hidden lg:flex p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-primary" />
              ) : (
                <Moon className="w-5 h-5 text-primary" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg bg-muted border border-border">
              <User className="w-5 h-5 text-primary" />
              <span className="text-sm font-mono text-foreground">
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
        className={`fixed top-[73px] left-0 bottom-0 w-64 bg-card border-r border-border z-40 lg:hidden transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
            >
              <HardDrive className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/documents"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold font-mono transition-all hover:scale-[1.02] border-2 border-primary/30"
            >
              <FileText className="w-5 h-5" />
              <span>Documents</span>
            </Link>
            <Link
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <Link
              to="/collections"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
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
        <aside className="hidden lg:block w-64 border-r border-border bg-card/50 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
              >
                <HardDrive className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold font-mono transition-all hover:scale-[1.02] border-2 border-primary/30">
                <FileText className="w-5 h-5" />
                <span>Documents</span>
              </div>
              <Link
                to="/chat"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link
                to="/collections"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
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
                className="gap-2 border-border text-primary hover:bg-muted hover:border-primary/50 font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">BACK</span>
              </Button>
              <div className="h-px flex-1 bg-gradient-to-r from-border via-border/50 to-transparent" />
            </div>

            <h1 className="text-4xl font-bold text-primary font-sans tracking-tight">
              DOCUMENT ARCHIVE
            </h1>
          </div>

          {/* Search & Filter */}
          <SearchFilter
            collections={collections}
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
                collections={collections}
              />
            </div>
          )}

          {/* Document List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    </div>
  );
}
