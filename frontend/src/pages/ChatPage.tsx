/**
 * Chat Page - Conversational Observatory
 * Refined minimalist chat interface with technical precision
 * Fonts: Fira Code (headings/timestamps), Inter (messages), Space Grotesk (titles)
 */

import {
  ArrowLeft,
  FileText,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  Plus,
  Send,
  Sun,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useDarkMode } from "../hooks/useDarkMode";
import { useAuthStore } from "../store/authStore";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: {
    document_name: string;
    chunk_index: number;
    relevance_score: number;
  }[];
}

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  created_at: Date;
}

export function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isStreaming] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Mock conversations (will be replaced with real API data)
  const conversations: Conversation[] = [
    {
      id: "1",
      title: "Understanding RAG Architecture",
      message_count: 12,
      created_at: new Date("2024-01-15"),
    },
    {
      id: "2",
      title: "Vector Database Best Practices",
      message_count: 8,
      created_at: new Date("2024-01-14"),
    },
    {
      id: "3",
      title: "Document Chunking Strategies",
      message_count: 5,
      created_at: new Date("2024-01-13"),
    },
  ];

  // Mock messages (will be replaced with real API data)
  const messages: Message[] = [
    {
      id: "1",
      role: "user",
      content: "What is RAG and how does it work?",
      timestamp: new Date("2024-01-15T10:00:00"),
    },
    {
      id: "2",
      role: "assistant",
      content:
        "RAG (Retrieval-Augmented Generation) is a technique that combines information retrieval with language generation. It works by first retrieving relevant documents from a knowledge base, then using those documents as context for generating accurate, grounded responses.",
      timestamp: new Date("2024-01-15T10:00:05"),
      sources: [
        {
          document_name: "rag-overview.pdf",
          chunk_index: 3,
          relevance_score: 0.92,
        },
        {
          document_name: "llm-techniques.md",
          chunk_index: 7,
          relevance_score: 0.87,
        },
      ],
    },
    {
      id: "3",
      role: "user",
      content: "Can you explain the retrieval process in more detail?",
      timestamp: new Date("2024-01-15T10:01:00"),
    },
    {
      id: "4",
      role: "assistant",
      content:
        "The retrieval process involves several key steps:\n\n1. Query Embedding: Your question is converted into a vector representation\n2. Similarity Search: The system searches through stored document chunks to find the most relevant ones\n3. Ranking: Retrieved chunks are ranked by relevance score\n4. Context Assembly: Top chunks are combined to provide context for the AI response\n\nThis ensures responses are grounded in your actual documents rather than hallucinated information.",
      timestamp: new Date("2024-01-15T10:01:08"),
      sources: [
        {
          document_name: "rag-overview.pdf",
          chunk_index: 5,
          relevance_score: 0.94,
        },
      ],
    },
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Implement API call to send message
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Logo & Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Space_Grotesk'] tracking-tight hidden sm:block">
                AI Chat
              </span>
            </Link>
          </div>

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

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSidebarOpen(false);
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Conversation List */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-300 flex flex-col`}
        >
          {/* Mobile Header with Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* Back to Documents - Mobile Only */}
          <div className="lg:hidden p-4 border-b border-slate-200 dark:border-slate-800">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Documents</span>
            </Link>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <Button className="w-full gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 font-['Inter'] font-medium">
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-['Inter']">
              Recent Conversations
            </h3>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                className="w-full text-left p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-1 group-hover:text-blue-500 transition-colors" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate font-['Inter'] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-['Fira_Code']">
                        {conv.message_count} msgs
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        •
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
                        {conv.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Back to Dashboard */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Back to Documents</span>
            </Link>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {msg.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[80%] bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-lg shadow-blue-500/20">
                        <p className="text-sm leading-relaxed font-['Inter']">
                          {msg.content}
                        </p>
                        <p className="text-xs text-blue-100 mt-2 font-['Fira_Code']">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* Assistant Message */
                    <div className="flex justify-start">
                      <div className="max-w-[85%]">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-['Inter'] whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-['Fira_Code']">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-['Inter']">
                              Sources
                            </p>
                            {msg.sources.map((source) => (
                              <div
                                key={`${source.document_name}-${source.chunk_index}`}
                                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-1.5 bg-blue-100 dark:bg-blue-950 rounded">
                                    <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate font-['Inter'] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {source.document_name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-slate-500 dark:text-slate-400 font-['Fira_Code']">
                                        Chunk #{source.chunk_index}
                                      </span>
                                      <span className="text-xs text-slate-400 dark:text-slate-500">
                                        •
                                      </span>
                                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-['Fira_Code']">
                                        {(source.relevance_score * 100).toFixed(
                                          0,
                                        )}
                                        % match
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-2 sm:gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask a question..."
                    rows={1}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 font-['Inter'] transition-all"
                    style={{
                      minHeight: "40px",
                      maxHeight: "200px",
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="h-10 sm:h-12 px-3 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-['Inter'] font-medium"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-['Inter'] hidden sm:block">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
