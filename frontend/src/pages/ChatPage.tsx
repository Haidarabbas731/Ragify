/**
 * Chat Page - Warm Atelier
 * Artist's studio aesthetic with terracotta, cream, and handwritten touches
 * Fonts: Caveat (handwritten headers), Crimson Text (elegant messages), Outfit (UI)
 */

import {
  ArrowLeft,
  Coffee,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
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
    <div className="h-screen flex flex-col bg-[#F4EBE4] dark:bg-[#2B2520]">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b-2 border-[#C67B5C] dark:border-[#8B5A3C] bg-[#E8D5C4]/95 dark:bg-[#3D3028]/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-[#5C4033] dark:text-[#D4A574]" />
            </button>

            {/* Logo & Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-[#C67B5C] dark:bg-[#8B5A3C] rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-lg">
                <Coffee className="w-6 h-6 text-[#FAF8F3]" strokeWidth={2.5} />
              </div>
              <span
                className="text-2xl font-bold text-[#5C4033] dark:text-[#F4EBE4] font-['Caveat'] tracking-wide hidden sm:block"
                style={{ letterSpacing: "0.02em" }}
              >
                Chat Studio
              </span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Dark Mode Toggle - Hidden on mobile (in sidebar instead) */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="hidden lg:flex p-2 rounded-lg hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-[#D4A574]" />
              ) : (
                <Moon className="w-5 h-5 text-[#5C4033]" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-full bg-[#FAF8F3] dark:bg-[#4D3D2F] border-2 border-[#D4A574] dark:border-[#8B5A3C]">
              <User className="w-4 h-4 text-[#8B5A3C] dark:text-[#D4A574]" />
              <span className="text-sm font-medium text-[#5C4033] dark:text-[#E8D5C4] font-['Outfit']">
                {user?.email}
              </span>
            </div>

            {/* Logout Button - Hidden on mobile (in sidebar instead) */}
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="hidden lg:flex gap-2 border-2 border-[#8B5A3C] dark:border-[#D4A574] text-[#8B5A3C] dark:text-[#D4A574] hover:bg-[#8B5A3C] hover:text-[#FAF8F3] dark:hover:bg-[#D4A574] dark:hover:text-[#2B2520] transition-all duration-300 font-['Outfit'] font-semibold rounded-full"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-[#2B2520]/60 backdrop-blur-sm z-30 lg:hidden cursor-default"
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
          } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full border-r-2 border-[#C67B5C] dark:border-[#8B5A3C] bg-[#E8D5C4] dark:bg-[#3D3028] transition-transform duration-300 flex flex-col`}
        >
          {/* Mobile Header with Close Button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b-2 border-[#C67B5C] dark:border-[#8B5A3C]">
            <h2 className="text-xl font-bold text-[#5C4033] dark:text-[#F4EBE4] font-['Caveat']">
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-[#5C4033] dark:text-[#D4A574]" />
            </button>
          </div>

          {/* Back to Documents - Mobile Only */}
          <div className="lg:hidden p-4 border-b-2 border-[#C67B5C] dark:border-[#8B5A3C]">
            <Link
              to="/dashboard"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 text-[#5C4033] dark:text-[#E8D5C4] font-['Outfit'] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Documents</span>
            </Link>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b-2 border-[#C67B5C] dark:border-[#8B5A3C]">
            <Button className="w-full gap-2 bg-[#C67B5C] hover:bg-[#B5674A] dark:bg-[#8B5A3C] dark:hover:bg-[#A0664A] text-[#FAF8F3] font-['Outfit'] font-semibold rounded-xl shadow-lg border-2 border-[#B5674A] dark:border-[#6D4832]">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              New Conversation
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h3 className="text-xs font-bold text-[#8B5A3C] dark:text-[#D4A574] uppercase tracking-wider mb-3 font-['Outfit']">
              Recent Chats
            </h3>
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                className="w-full text-left p-4 rounded-xl hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 transition-all group border-2 border-transparent hover:border-[#C67B5C] dark:hover:border-[#8B5A3C]"
              >
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-[#8B5A3C] dark:text-[#D4A574] mt-1 group-hover:scale-110 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#5C4033] dark:text-[#F4EBE4] font-['Outfit'] leading-relaxed">
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-[#8B5A3C] dark:text-[#D4A574] font-['Outfit'] font-semibold">
                        {conv.message_count} messages
                      </span>
                      <span className="text-xs text-[#A0826D]">•</span>
                      <span className="text-xs text-[#8B5A3C] dark:text-[#D4A574] font-['Outfit']">
                        {conv.created_at.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Bottom Actions - Desktop */}
          <div className="hidden lg:block p-4 border-t-2 border-[#C67B5C] dark:border-[#8B5A3C]">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 text-[#5C4033] dark:text-[#E8D5C4] font-['Outfit'] transition-all font-medium"
            >
              <FileText className="w-5 h-5" />
              <span className="text-sm">Back to Documents</span>
            </Link>
          </div>

          {/* Bottom Actions - Mobile */}
          <div className="lg:hidden p-4 border-t-2 border-[#C67B5C] dark:border-[#8B5A3C] space-y-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#D4A574]/30 dark:hover:bg-[#4D3D2F]/50 text-[#5C4033] dark:text-[#E8D5C4] text-sm font-['Outfit'] font-medium transition-all"
            >
              {darkMode ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#8B5A3C]/20 dark:hover:bg-[#D4A574]/20 text-[#8B5A3C] dark:text-[#D4A574] text-sm font-['Outfit'] font-medium transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#FAF8F3] dark:bg-[#1F1A15]">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-8">
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {msg.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[75%] bg-[#C67B5C] dark:bg-[#8B5A3C] text-[#FAF8F3] rounded-3xl rounded-br-md px-6 py-4 shadow-xl border-2 border-[#B5674A] dark:border-[#6D4832]">
                        <p className="text-base leading-relaxed font-['Outfit'] font-medium">
                          {msg.content}
                        </p>
                        <p className="text-xs text-[#F4EBE4]/80 mt-3 font-['Outfit'] italic">
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
                        <div className="bg-white dark:bg-[#2B2520] rounded-3xl rounded-tl-md px-6 py-5 shadow-xl border-2 border-[#E8D5C4] dark:border-[#4D3D2F]">
                          <p className="text-base leading-relaxed text-[#3D2E26] dark:text-[#E8D5C4] font-['Crimson_Text'] whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p className="text-xs text-[#8B5A3C] dark:text-[#D4A574] mt-4 font-['Outfit'] italic">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <p className="text-xs font-bold text-[#8B5A3C] dark:text-[#D4A574] uppercase tracking-wider font-['Outfit'] mb-2">
                              Sources
                            </p>
                            {msg.sources.map((source) => (
                              <div
                                key={`${source.document_name}-${source.chunk_index}`}
                                className="bg-[#F4EBE4] dark:bg-[#3D3028] border-2 border-[#E8D5C4] dark:border-[#4D3D2F] rounded-2xl p-4 hover:border-[#C67B5C] dark:hover:border-[#8B5A3C] hover:shadow-lg transition-all cursor-pointer group"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-[#D4A574] dark:bg-[#8B5A3C] rounded-xl">
                                    <FileText className="w-4 h-4 text-[#FAF8F3]" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#5C4033] dark:text-[#F4EBE4] font-['Outfit'] group-hover:text-[#C67B5C] dark:group-hover:text-[#D4A574] transition-colors">
                                      {source.document_name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs text-[#8B5A3C] dark:text-[#D4A574] font-['Outfit']">
                                        Chunk #{source.chunk_index}
                                      </span>
                                      <span className="text-xs text-[#A0826D]">
                                        •
                                      </span>
                                      <span className="text-xs text-[#5C8B3C] dark:text-[#7FA550] font-['Outfit'] font-bold">
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
                  <div className="bg-white dark:bg-[#2B2520] rounded-3xl rounded-tl-md px-6 py-5 shadow-xl border-2 border-[#E8D5C4] dark:border-[#4D3D2F]">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-[#C67B5C] dark:bg-[#D4A574] rounded-full animate-bounce" />
                      <div
                        className="w-3 h-3 bg-[#C67B5C] dark:bg-[#D4A574] rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-3 h-3 bg-[#C67B5C] dark:bg-[#D4A574] rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                      <span className="text-sm text-[#8B5A3C] dark:text-[#D4A574] font-['Outfit'] italic ml-2">
                        thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t-2 border-[#E8D5C4] dark:border-[#4D3D2F] bg-[#F4EBE4] dark:bg-[#2B2520] p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Share your thoughts..."
                    rows={1}
                    className="w-full px-5 py-4 text-base bg-white dark:bg-[#3D3028] border-2 border-[#D4A574] dark:border-[#8B5A3C] rounded-2xl resize-none focus:outline-none focus:ring-4 focus:ring-[#D4A574]/30 dark:focus:ring-[#8B5A3C]/30 focus:border-[#C67B5C] dark:focus:border-[#D4A574] text-[#3D2E26] dark:text-[#E8D5C4] placeholder:text-[#A0826D] dark:placeholder:text-[#8B5A3C] font-['Outfit'] transition-all shadow-lg"
                    style={{
                      minHeight: "56px",
                      maxHeight: "200px",
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="h-14 px-6 bg-[#C67B5C] hover:bg-[#B5674A] dark:bg-[#8B5A3C] dark:hover:bg-[#A0664A] disabled:opacity-40 disabled:cursor-not-allowed font-['Outfit'] font-bold rounded-2xl shadow-lg border-2 border-[#B5674A] dark:border-[#6D4832] text-[#FAF8F3]"
                >
                  <Send className="w-5 h-5" strokeWidth={2.5} />
                </Button>
              </div>
              <p className="text-xs text-[#8B5A3C] dark:text-[#D4A574] mt-3 font-['Outfit'] italic hidden sm:block">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
