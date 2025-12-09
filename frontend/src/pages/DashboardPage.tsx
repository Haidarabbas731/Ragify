/**
 * Dashboard Page - Data Observatory
 * Clean, functional design with purple theme
 * Fonts: Geist (UI), Geist Mono (data/stats)
 */

import {
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Shield,
  Sun,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DocumentList } from "../components/documents/DocumentList";
import { UploadZone } from "../components/documents/UploadZone";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useDeleteDocument, useDocuments } from "../hooks/useDocuments";
import { useUserStats } from "../hooks/useUserStats";
import { useAuthStore } from "../store/authStore";

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initialize and get dark mode state
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Fetch user stats from API
  const { data: statsData, isLoading, error } = useUserStats();

  // Fetch recent documents (5 most recent)
  const { data: recentDocumentsData, refetch: refetchDocuments } = useDocuments(
    {
      page: 1,
      limit: 5,
      sort_by: "uploaded_at",
      order: "desc",
    },
  );

  // Delete document mutation
  const deleteDocumentMutation = useDeleteDocument();

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocumentMutation.mutateAsync(documentId);
      // Refetch documents and stats after deletion
      refetchDocuments();
    } catch (error) {
      // Error is handled by the mutation hook
      console.error("Failed to delete document:", error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-sans">
            Loading dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !statsData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-sans mb-4">
            Failed to load dashboard stats
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Map API data to stats object for backward compatibility
  const stats = {
    totalDocuments: statsData.total_documents,
    totalChunks: statsData.total_chunks,
    storageUsed: statsData.storage_used_mb,
    storageLimit: statsData.storage_limit_mb,
  };

  const storagePercentage = statsData.storage_percentage;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <FileText className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary font-sans tracking-tight">
              Knowledge Base
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground font-sans focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

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
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden cursor-default"
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileMenuOpen(false);
          }}
          aria-label="Close menu"
        />
      )}

      {/* Mobile Menu Drawer */}
      <aside
        className={`fixed top-[73px] left-0 bottom-0 w-64 bg-card border-r border-border z-50 lg:hidden transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold font-mono transition-all hover:scale-[1.02] border-2 border-primary/30"
            >
              <HardDrive className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/documents"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
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

            {/* Admin Panel Link - Only visible for admin users */}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="relative flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-sans font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 group"
              >
                <Shield className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Collections Section */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">
              Collections
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-sans transition-all hover:scale-[1.02]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>All Documents</span>
                <span className="ml-auto text-xs font-mono font-semibold">
                  {stats.totalDocuments}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="mt-auto pt-6 space-y-3 border-t border-border">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground text-sm font-mono transition-all"
            >
              {darkMode ? (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-foreground hover:text-red-600 dark:hover:text-red-400 text-sm font-mono transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 border-r border-border bg-card sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold font-mono transition-all hover:scale-[1.02] border-2 border-primary/30"
              >
                <HardDrive className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/documents"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
              >
                <FileText className="w-5 h-5" />
                <span>Documents</span>
              </Link>
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

              {/* Admin Panel Link - Only visible for admin users */}
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="relative flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-sans font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/20 group"
                >
                  <Shield className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Collections Section */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">
                Collections
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted text-muted-foreground text-sm font-mono transition-all hover:scale-[1.02]"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Documents</span>
                  <span className="ml-auto text-xs font-mono font-semibold">
                    {stats.totalDocuments}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Documents */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase font-sans tracking-wide">
                  Documents
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {stats.totalDocuments}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-sans">
                  Total files uploaded
                </p>
              </div>
            </div>

            {/* Total Chunks */}
            <div className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase font-sans tracking-wide">
                  Chunks
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                  {stats.totalChunks.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 font-sans">
                  Vector embeddings
                </p>
              </div>
            </div>

            {/* Storage Used */}
            <div className="bg-card border border-border rounded-xl p-6 sm:col-span-2 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <HardDrive className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-muted-foreground uppercase font-sans tracking-wide">
                  Storage
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                    {stats.storageUsed}
                  </p>
                  <span className="text-lg font-medium text-slate-600 dark:text-slate-300 font-sans">
                    MB
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-sans">
                    / {stats.storageLimit} MB
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        storagePercentage >= 90
                          ? "bg-gradient-to-r from-red-500 to-orange-500"
                          : storagePercentage >= 70
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-primary"
                      }`}
                      style={{ width: `${storagePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-sans">
                    {storagePercentage < 0.1 && storagePercentage > 0
                      ? storagePercentage.toFixed(3)
                      : storagePercentage.toFixed(1)}
                    % used
                    {storagePercentage >= 90 && (
                      <span className="text-red-500 font-semibold ml-2">
                        ⚠️ Nearly full
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            <UploadZone
              onUploadComplete={() => console.log("Upload complete")}
            />
          </div>

          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground font-sans tracking-tight">
                Recent Documents
              </h2>
              <Button
                onClick={() => navigate("/documents")}
                variant="outline"
                size="sm"
                className="font-sans font-medium border-border text-foreground hover:bg-muted"
              >
                View All
              </Button>
            </div>

            {/* Document List */}
            <DocumentList
              documents={recentDocumentsData?.documents || []}
              onDocumentClick={(id) => navigate(`/documents/${id}`)}
              onDeleteDocument={handleDeleteDocument}
              onRetryDocument={(id) => console.log("Retry document:", id)}
              hideCheckboxes={true}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
