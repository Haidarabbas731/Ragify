/**
 * Collections Page - Collection Management Interface
 * Full-page view for managing document collections
 */

import {
  FileText,
  FolderOpen,
  HardDrive,
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
import { Collections } from "../components/documents/Collections";
import { Button } from "../components/ui/button";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuthStore } from "../store/authStore";

export function CollectionsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);

  // Initialize and get dark mode state
  const { darkMode, toggleDarkMode } = useDarkMode();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSelectCollection = (collectionId: string | null) => {
    setSelectedCollectionId(collectionId);
    // Navigate to dashboard with collection filter
    if (collectionId) {
      navigate(`/dashboard?collection=${collectionId}`);
    } else {
      navigate("/dashboard");
    }
  };

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
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
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
              <span>All Documents</span>
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
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold font-mono transition-all hover:scale-[1.02] border-2 border-primary/30"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Collections</span>
            </Link>
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
              <Link
                to="/documents"
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-mono transition-all hover:scale-[1.02] border border-border"
              >
                <FileText className="w-5 h-5" />
                <span>All Documents</span>
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
                className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary/10 text-primary font-bold font-mono transition-all hover:scale-[1.02] border-2 border-primary/30"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Collections</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <Collections
            onSelectCollection={handleSelectCollection}
            selectedCollectionId={selectedCollectionId}
          />
        </main>
      </div>
    </div>
  );
}
