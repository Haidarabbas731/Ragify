/**
 * Profile Page - Personal Command Center
 * Clean design with purple theme and circular progress indicators
 * Fonts: Geist (UI), Geist Mono (stats/API keys)
 */

import {
  Camera,
  FileText,
  HardDrive,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Moon,
  Save,
  Settings,
  Sun,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChangePasswordForm } from "../components/profile/ChangePasswordForm";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useUserProfile } from "../hooks/useUserProfile";
import { useAuthStore } from "../store/authStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "usage" | "preferences"
  >("profile");

  // Fetch user profile from API
  const { data: profile, isLoading, error } = useUserProfile();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-sans">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive font-sans mb-4">
            Failed to load profile
          </p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  // Extract data from profile
  const userData = {
    email: profile.email,
    name: profile.email.split("@")[0], // Use email username as display name
    avatar: null,
    created_at: new Date(profile.created_at),
    role: profile.role,
  };

  // Storage stats from profile
  const storagePercentage = profile.storage_percentage;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <div className="bg-card border border-border rounded-xl p-4 space-y-2 sticky top-24">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-sans font-medium ${
                activeTab === "profile"
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile Info</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-sans font-medium ${
                activeTab === "security"
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>Security</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("usage")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-sans font-medium ${
                activeTab === "usage"
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <HardDrive className="w-5 h-5" />
              <span>Usage & Quota</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-sans font-medium ${
                activeTab === "preferences"
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-muted text-foreground"
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Preferences</span>
            </button>

            {/* Back to Dashboard */}
            <div className="pt-4 mt-4 border-t border-border">
              <Link
                to="/dashboard"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-sans transition-all"
              >
                <FileText className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-6">
          {/* Profile Info Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-sans">
                  Profile Information
                </h2>

                {/* Avatar Upload */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold font-mono">
                      {userData.name.charAt(0)}
                    </div>
                    <button
                      type="button"
                      className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <Camera className="w-6 h-6 text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground font-sans">
                      {userData.name}
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans">
                      {userData.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      Member since {userData.created_at.toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 font-sans border-border text-foreground hover:bg-muted"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Change Avatar
                    </Button>
                  </div>
                </div>

                {/* Profile Form */}
                <div className="space-y-4">
                  <div>
                    <Label className="font-sans font-medium text-foreground">
                      Display Name
                    </Label>
                    <Input
                      defaultValue={userData.name}
                      className="mt-1 font-sans bg-card border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="font-sans font-medium text-foreground">
                      Email Address
                    </Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        defaultValue={userData.email}
                        className="pl-10 font-sans bg-muted border-border text-foreground"
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 font-sans">
                      Email cannot be changed
                    </p>
                  </div>
                  <Button className="gap-2 font-sans font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all duration-300 border-0">
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card border border-border rounded-xl p-6">
                <ChangePasswordForm />
              </div>

              {/* API Key Section */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-sans">
                  API Access
                </h2>
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-sans font-medium text-foreground">
                      API Key
                    </Label>
                    <Button variant="ghost" size="sm" className="font-sans">
                      Regenerate
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-background px-3 py-2 rounded border border-border text-sm font-mono text-foreground">
                      kb_••••••••••••••••••••1a2b
                    </code>
                    <Button variant="outline" size="sm" className="font-sans">
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage & Quota Tab */}
          {activeTab === "usage" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-sans">
                  Usage Statistics
                </h2>

                {/* Storage Usage - Only available metric from profile */}
                <div className="flex justify-center">
                  {/* Storage */}
                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg
                        className="w-40 h-40 transform -rotate-90"
                        role="img"
                        aria-label="Storage usage progress"
                      >
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="none"
                          className="text-border"
                        />
                        <circle
                          cx="80"
                          cy="80"
                          r="70"
                          stroke="currentColor"
                          strokeWidth="10"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 70}`}
                          strokeDashoffset={`${
                            2 * Math.PI * 70 * (1 - storagePercentage / 100)
                          }`}
                          className={`transition-all duration-1000 ${
                            storagePercentage >= 90
                              ? "text-red-500"
                              : storagePercentage >= 70
                                ? "text-yellow-500"
                                : "text-primary"
                          }`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-foreground font-mono">
                          {profile.storage_used_mb.toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground font-sans">
                          MB
                        </span>
                      </div>
                    </div>
                    <h3 className="mt-6 text-xl font-semibold text-foreground font-sans">
                      Storage Used
                    </h3>
                    <p className="text-sm text-muted-foreground font-sans mt-2">
                      {storagePercentage.toFixed(1)}% of{" "}
                      {profile.storage_limit_mb.toFixed(0)} MB
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {(
                        profile.storage_limit_mb - profile.storage_used_mb
                      ).toFixed(1)}{" "}
                      MB remaining
                    </p>
                  </div>
                </div>

                {/* Storage Details */}
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-lg font-semibold text-foreground mb-4 font-sans">
                    Storage Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground font-sans">
                        Used
                      </p>
                      <p className="text-2xl font-bold text-foreground font-mono mt-1">
                        {profile.storage_used_mb.toFixed(2)} MB
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {(
                          profile.storage_used_bytes /
                          (1024 * 1024 * 1024)
                        ).toFixed(4)}{" "}
                        GB
                      </p>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm text-muted-foreground font-sans">
                        Limit
                      </p>
                      <p className="text-2xl font-bold text-foreground font-mono mt-1">
                        {profile.storage_limit_mb.toFixed(0)} MB
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {(
                          profile.storage_limit_bytes /
                          (1024 * 1024 * 1024)
                        ).toFixed(2)}{" "}
                        GB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Note about document stats */}
                <div className="mt-6 p-4 bg-primary/10 border border-primary/30 rounded-lg">
                  <p className="text-sm text-foreground font-sans">
                    <strong>Note:</strong> For detailed document statistics,
                    visit the{" "}
                    <Link
                      to="/dashboard"
                      className="underline hover:text-primary"
                    >
                      Dashboard page
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-2xl font-bold text-foreground mb-6 font-sans">
                  Preferences
                </h2>

                <div className="space-y-6">
                  {/* Theme Preference */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <h3 className="font-semibold text-foreground font-sans">
                        Dark Mode
                      </h3>
                      <p className="text-sm text-muted-foreground font-sans">
                        Use dark theme across the application
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDarkMode}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        darkMode ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          darkMode ? "translate-x-6" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email Notifications */}
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <h3 className="font-semibold text-foreground font-sans">
                        Email Notifications
                      </h3>
                      <p className="text-sm text-muted-foreground font-sans">
                        Receive updates about document processing
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>

                  {/* Auto-save */}
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h3 className="font-semibold text-foreground font-sans">
                        Auto-save Chats
                      </h3>
                      <p className="text-sm text-muted-foreground font-sans">
                        Automatically save chat conversations
                      </p>
                    </div>
                    <button
                      type="button"
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary transition-colors"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 font-sans">
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground mb-4 font-sans">
                  Once you delete your account, there is no going back. Please
                  be certain.
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-sans font-medium"
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
