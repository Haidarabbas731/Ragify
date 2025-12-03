/**
 * Dashboard Page - Data Observatory
 * Industrial-futuristic control room aesthetic with Mission Control typography
 * Fonts: Space Grotesk (headings), Inter (UI), Fira Code (data/stats)
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
import { useDocuments } from "../hooks/useDocuments";
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
  const { data: recentDocumentsData } = useDocuments({
    page: 1,
    limit: 5,
    sort_by: "uploaded_at",
    order: "desc",
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-['Inter']">
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
          <p className="text-red-600 dark:text-red-400 font-['Inter'] mb-4">
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            ) : (
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
          </button>

          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Space_Grotesk'] tracking-tight">
              Knowledge Base
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <Input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 font-['Inter'] focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            {/* Dark Mode Toggle - Hidden on mobile (in sidebar instead) */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent">
              <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 font-['Inter']">
                {user?.email}
              </span>
            </div>

            {/* Logout Button - Hidden on mobile (in sidebar instead) */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hidden lg:flex gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-['Inter'] font-medium"
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
        className={`fixed top-[73px] left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 lg:hidden transform transition-transform duration-300 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 space-y-6 overflow-y-auto h-full">
          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <HardDrive className="w-5 h-5" />
              <span>Documents</span>
            </Link>
            <Link
              to="/documents"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <FileText className="w-5 h-5" />
              <span>All Documents</span>
            </Link>
            <Link
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </Link>
            <Link
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Link>
            <Link
              to="/collections"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Collections</span>
            </Link>

            {/* Admin Panel Link - Only visible for admin users */}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="relative flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 font-['Inter'] font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10 group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <Shield className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Admin Panel</span>
              </Link>
            )}
          </div>

          {/* Collections Section */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-['Inter']">
              Collections
            </h3>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-['Inter'] transition-all hover:scale-[1.02]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>All Documents</span>
                <span className="ml-auto text-xs font-['Fira_Code'] font-semibold">
                  {stats.totalDocuments}
                </span>
              </button>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="mt-auto pt-6 space-y-3 border-t border-slate-200 dark:border-slate-800">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-['Inter'] transition-all"
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
              className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 text-sm font-['Inter'] transition-all"
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
        <aside className="hidden lg:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Navigation Links */}
            <div className="space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium font-['Inter'] transition-all hover:scale-[1.02]"
              >
                <HardDrive className="w-5 h-5" />
                <span>Documents</span>
              </Link>
              <Link
                to="/documents"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
              >
                <FileText className="w-5 h-5" />
                <span>All Documents</span>
              </Link>
              <Link
                to="/chat"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link
                to="/collections"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Collections</span>
              </Link>

              {/* Admin Panel Link - Only visible for admin users */}
              {user?.role === "admin" && (
                <Link
                  to="/admin"
                  className="relative flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/50 dark:to-blue-950/50 border border-purple-200/50 dark:border-purple-800/50 text-purple-700 dark:text-purple-300 font-['Inter'] font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 dark:hover:shadow-purple-500/10 group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-blue-500/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                  <Shield className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">Admin Panel</span>
                </Link>
              )}
            </div>

            {/* Collections Section */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-['Inter']">
                Collections
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-['Inter'] transition-all hover:scale-[1.02]"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>All Documents</span>
                  <span className="ml-auto text-xs font-['Fira_Code'] font-semibold">
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
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-950 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-['Inter'] tracking-wide">
                  Documents
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold font-['Fira_Code'] text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.totalDocuments}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                  Total files uploaded
                </p>
              </div>
            </div>

            {/* Total Chunks */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                  <FolderOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-['Inter'] tracking-wide">
                  Chunks
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-3xl font-bold font-['Fira_Code'] text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.totalChunks.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                  Vector embeddings
                </p>
              </div>
            </div>

            {/* Storage Used */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:col-span-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950 rounded-lg">
                  <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase font-['Inter'] tracking-wide">
                  Storage
                </span>
              </div>
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold font-['Fira_Code'] text-slate-900 dark:text-slate-100 tabular-nums">
                    {stats.storageUsed}
                  </p>
                  <span className="text-lg font-medium text-slate-500 dark:text-slate-400 font-['Inter']">
                    MB
                  </span>
                  <span className="text-sm text-slate-400 dark:text-slate-500 font-['Inter']">
                    / {stats.storageLimit} MB
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        storagePercentage >= 90
                          ? "bg-gradient-to-r from-red-500 to-orange-500"
                          : storagePercentage >= 70
                            ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                            : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                      }`}
                      style={{ width: `${storagePercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
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
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk'] tracking-tight">
                Recent Documents
              </h2>
              <Button
                onClick={() => navigate("/documents")}
                variant="outline"
                size="sm"
                className="font-['Inter'] font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                View All
              </Button>
            </div>

            {/* Document List */}
            <DocumentList
              documents={recentDocumentsData?.documents || []}
              onDocumentClick={(id) => navigate(`/documents/${id}`)}
              onDeleteDocument={(id) => console.log("Delete document:", id)}
              onRetryDocument={(id) => console.log("Retry document:", id)}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
