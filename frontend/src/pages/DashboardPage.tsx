/**
 * Dashboard Page - Data Observatory
 * Industrial-futuristic control room aesthetic with Mission Control typography
 * Fonts: Space Grotesk (headings), Inter (UI), Fira Code (data/stats)
 */

import {
  FileText,
  FolderOpen,
  HardDrive,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Search,
  Sun,
  Upload,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useDarkMode } from "../hooks/useDarkMode";
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

  // Mock stats (will be replaced with real API data)
  const stats = {
    totalDocuments: 42,
    totalChunks: 1247,
    storageUsed: 523, // MB
    storageLimit: 1024, // MB (1GB)
  };

  const storagePercentage = (stats.storageUsed / stats.storageLimit) * 100;

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

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent">
              <User className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:block font-['Inter']">
                {user?.email}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-300 font-['Inter'] font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
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
        <aside className="hidden lg:block w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[calc(100vh-73px)]">
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
                    {storagePercentage.toFixed(1)}% used
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
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-xl p-8 mb-8 text-center hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="max-w-md mx-auto space-y-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2 font-['Space_Grotesk']">
                  Upload Documents
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
                  Drag & drop files here or click to browse
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-['Inter']">
                  Supports PDF, DOCX, TXT, MD • Max 50MB per file
                </p>
              </div>
              <Button className="gap-2 font-['Inter'] font-medium">
                <Upload className="w-4 h-4" />
                Select Files
              </Button>
            </div>
          </div>

          {/* Documents Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk'] tracking-tight">
                Recent Documents
              </h2>
              <Button
                variant="outline"
                size="sm"
                className="font-['Inter'] font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                View All
              </Button>
            </div>

            {/* Empty State */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="mx-auto w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 font-['Space_Grotesk']">
                    No documents yet
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
                    Upload your first document to get started with your AI
                    knowledge base
                  </p>
                </div>
                <Button className="gap-2 font-['Inter'] font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 border-0">
                  <Upload className="w-4 h-4" />
                  Upload Document
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
