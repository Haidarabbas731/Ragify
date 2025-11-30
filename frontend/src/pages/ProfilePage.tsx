/**
 * Profile Page - Personal Command Center
 * Sophisticated dashboard with glass cards and circular progress indicators
 * Fonts: Fira Code (stats/API keys), Space Grotesk (headings), Inter (body)
 */

import {
  Camera,
  FileText,
  HardDrive,
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
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuthStore } from "../store/authStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "usage" | "preferences"
  >("profile");

  // Mock user data (will be replaced with real API data)
  const userData = {
    email: user?.email || "user@example.com",
    name: "John Doe",
    avatar: null,
    created_at: new Date("2024-01-01"),
    role: user?.role || "user",
  };

  // Mock usage stats (will be replaced with real API data)
  const usageStats = {
    documents: 42,
    documentsLimit: 1000,
    storage: 523, // MB
    storageLimit: 1024, // MB
    apiCalls: 1247,
    apiCallsLimit: 10000,
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Calculate percentages
  const documentsPercentage =
    (usageStats.documents / usageStats.documentsLimit) * 100;
  const storagePercentage =
    (usageStats.storage / usageStats.storageLimit) * 100;
  const apiCallsPercentage =
    (usageStats.apiCalls / usageStats.apiCallsLimit) * 100;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <User className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Space_Grotesk'] tracking-tight">
              Profile
            </span>
          </Link>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2 sticky top-24">
              <button
                type="button"
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Inter'] font-medium ${
                  activeTab === "profile"
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <User className="w-5 h-5" />
                <span>Profile Info</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("security")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Inter'] font-medium ${
                  activeTab === "security"
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Lock className="w-5 h-5" />
                <span>Security</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("usage")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Inter'] font-medium ${
                  activeTab === "usage"
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <HardDrive className="w-5 h-5" />
                <span>Usage & Quota</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preferences")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all font-['Inter'] font-medium ${
                  activeTab === "preferences"
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Preferences</span>
              </button>

              {/* Back to Dashboard */}
              <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
                <Link
                  to="/dashboard"
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all"
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-['Space_Grotesk']">
                    Profile Information
                  </h2>

                  {/* Avatar Upload */}
                  <div className="flex items-start gap-6 mb-6">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold font-['Fira_Code']">
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
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
                        {userData.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                        {userData.email}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-['Fira_Code']">
                        Member since {userData.created_at.toLocaleDateString()}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 font-['Inter']"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Change Avatar
                      </Button>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <div className="space-y-4">
                    <div>
                      <Label className="font-['Inter'] font-medium">
                        Display Name
                      </Label>
                      <Input
                        defaultValue={userData.name}
                        className="mt-1 font-['Inter']"
                      />
                    </div>
                    <div>
                      <Label className="font-['Inter'] font-medium">
                        Email Address
                      </Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          defaultValue={userData.email}
                          className="pl-10 font-['Inter']"
                          disabled
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-['Inter']">
                        Email cannot be changed
                      </p>
                    </div>
                    <Button className="gap-2 font-['Inter'] font-medium">
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-['Space_Grotesk']">
                    Change Password
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <Label className="font-['Inter'] font-medium">
                        Current Password
                      </Label>
                      <Input
                        type="password"
                        className="mt-1 font-['Inter']"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label className="font-['Inter'] font-medium">
                        New Password
                      </Label>
                      <Input
                        type="password"
                        className="mt-1 font-['Inter']"
                        placeholder="••••••••"
                      />
                    </div>
                    <div>
                      <Label className="font-['Inter'] font-medium">
                        Confirm New Password
                      </Label>
                      <Input
                        type="password"
                        className="mt-1 font-['Inter']"
                        placeholder="••••••••"
                      />
                    </div>
                    <Button className="gap-2 font-['Inter'] font-medium">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </Button>
                  </div>
                </div>

                {/* API Key Section */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-['Space_Grotesk']">
                    API Access
                  </h2>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="font-['Inter'] font-medium">
                        API Key
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="font-['Inter']"
                      >
                        Regenerate
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded border border-slate-200 dark:border-slate-700 text-sm font-['Fira_Code'] text-slate-700 dark:text-slate-300">
                        kb_••••••••••••••••••••1a2b
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="font-['Inter']"
                      >
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
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-['Space_Grotesk']">
                    Usage Statistics
                  </h2>

                  {/* Circular Progress Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Documents */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <svg
                          className="w-32 h-32 transform -rotate-90"
                          role="img"
                          aria-label="Documents usage progress"
                        >
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-200 dark:text-slate-800"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 56 * (1 - documentsPercentage / 100)
                            }`}
                            className="text-blue-500 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Fira_Code']">
                            {usageStats.documents}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
                            of {usageStats.documentsLimit}
                          </span>
                        </div>
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
                        Documents
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                        {documentsPercentage.toFixed(1)}% used
                      </p>
                    </div>

                    {/* Storage */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <svg
                          className="w-32 h-32 transform -rotate-90"
                          role="img"
                          aria-label="Storage usage progress"
                        >
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-200 dark:text-slate-800"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 56 * (1 - storagePercentage / 100)
                            }`}
                            className={`transition-all duration-1000 ${
                              storagePercentage >= 90
                                ? "text-red-500"
                                : storagePercentage >= 70
                                  ? "text-yellow-500"
                                  : "text-emerald-500"
                            }`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Fira_Code']">
                            {usageStats.storage}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
                            MB
                          </span>
                        </div>
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
                        Storage
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                        {storagePercentage.toFixed(1)}% of{" "}
                        {usageStats.storageLimit} MB
                      </p>
                    </div>

                    {/* API Calls */}
                    <div className="text-center">
                      <div className="relative inline-block">
                        <svg
                          className="w-32 h-32 transform -rotate-90"
                          role="img"
                          aria-label="API usage progress"
                        >
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-200 dark:text-slate-800"
                          />
                          <circle
                            cx="64"
                            cy="64"
                            r="56"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 56}`}
                            strokeDashoffset={`${
                              2 * Math.PI * 56 * (1 - apiCallsPercentage / 100)
                            }`}
                            className="text-purple-500 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Fira_Code']">
                            {usageStats.apiCalls.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
                            calls
                          </span>
                        </div>
                      </div>
                      <h3 className="mt-4 font-semibold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
                        API Usage
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                        {apiCallsPercentage.toFixed(1)}% of monthly limit
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-6 font-['Space_Grotesk']">
                    Preferences
                  </h2>

                  <div className="space-y-6">
                    {/* Theme Preference */}
                    <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-['Inter']">
                          Dark Mode
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                          Use dark theme across the application
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          darkMode ? "bg-blue-600" : "bg-slate-300"
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
                    <div className="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-['Inter']">
                          Email Notifications
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                          Receive updates about document processing
                        </p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                      </button>
                    </div>

                    {/* Auto-save */}
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 font-['Inter']">
                          Auto-save Chats
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                          Automatically save chat conversations
                        </p>
                      </div>
                      <button
                        type="button"
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors"
                      >
                        <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4 font-['Space_Grotesk']">
                    Danger Zone
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-['Inter']">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-['Inter'] font-medium"
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
    </div>
  );
}
