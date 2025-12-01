/**
 * Chat Page - Warm Modernist Library
 * Sophisticated chat interface inspired by contemporary libraries at golden hour
 * Fonts: Lora (headings), Source Serif Pro (reading), Inter (UI)
 * Color: Cream, soft peach, warm grays, terracotta, sage green
 * Style: Organic shapes, soft shadows, glassmorphism, coffee & paper palette
 */

import {
  BookMarked,
  Coffee,
  FileText,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Plus,
  Send,
  Sparkles,
  Sun,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MarkdownContent } from "../components/chat/MarkdownContent";
import { Button } from "../components/ui/button";
import { useChatStream } from "../hooks/useChatStream";
import { useDarkMode } from "../contexts/DarkModeContext";
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

// Mock messages for demonstration
const MOCK_MESSAGES: Message[] = [
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
      "**RAG (Retrieval-Augmented Generation)** is a technique that combines information retrieval with language generation.\n\n## How it works:\n\n1. **Retrieval**: First retrieves relevant documents from a knowledge base\n2. **Augmentation**: Uses those documents as context\n3. **Generation**: Generates accurate, grounded responses\n\nHere's a simple example:\n\n```python\ndef retrieve_and_generate(query, knowledge_base):\n    # Retrieve relevant documents\n    relevant_docs = search(query, knowledge_base)\n    \n    # Generate response with context\n    response = llm.generate(query, context=relevant_docs)\n    \n    return response\n```\n\nThis approach ensures responses are both *accurate* and *verifiable*.",
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
      "The retrieval process involves several key steps:\n\n1. **Query Embedding**: Your question is converted into a vector representation\n2. **Similarity Search**: The system searches through stored document chunks to find the most relevant ones\n3. **Ranking**: Retrieved chunks are ranked by relevance score\n4. **Context Assembly**: Top chunks are combined to provide context for the AI response\n\nThis ensures responses are grounded in your actual documents rather than hallucinated information.",
    timestamp: new Date("2024-01-15T10:01:05"),
    sources: [
      {
        document_name: "rag-overview.pdf",
        chunk_index: 5,
        relevance_score: 0.94,
      },
    ],
  },
];

export function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [currentConversationId] = useState<string | null>(null);

  // Ref for auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Streaming hook
  const { isStreaming, streamChat } = useChatStream();

  // Check if user is near bottom of chat
  const checkScrollPosition = useCallback(() => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        messagesContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isNear = distanceFromBottom < 100;
      setIsNearBottom(isNear);
    }
  }, []);

  // Auto-scroll to bottom smoothly
  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    }
  }, []);

  // Auto-scroll when messages change or streaming, but only if near bottom
  // biome-ignore lint/correctness/useExhaustiveDependencies: Need messages to trigger scroll on new messages
  useEffect(() => {
    if (isNearBottom || isStreaming) {
      scrollToBottom(true);
    }
  }, [messages, isStreaming, isNearBottom, scrollToBottom]);

  // Initial scroll to bottom on mount
  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      checkScrollPosition(); // Check initial position
      return () => container.removeEventListener("scroll", checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    // Create placeholder for assistant message (without timestamp initially)
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(), // Will be updated on completion
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Stream the response
    await streamChat({
      query: userMessage.content,
      conversationId: currentConversationId || undefined,
      onChunk: (chunk) => {
        // Update assistant message with streaming content
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg,
          ),
        );
      },
      onComplete: (fullResponse, sources) => {
        // Update with final response and sources
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse, sources }
              : msg,
          ),
        );
      },
      onError: (error) => {
        // Show error message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: `**Error:** ${error}\n\nPlease try again.`,
                }
              : msg,
          ),
        );
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-stone-50 via-amber-50/30 to-orange-50/20 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 font-['Inter'] transition-colors duration-700">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 backdrop-blur-2xl bg-white/60 dark:bg-stone-950/60 border-b border-stone-200/40 dark:border-stone-700/40 shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2.5 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all duration-300"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-stone-700 dark:text-stone-300" />
            </button>

            {/* Logo & Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
                <div className="relative w-11 h-11 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-3xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-amber-200/50 dark:border-amber-700/30">
                  <Coffee className="w-5 h-5 text-amber-700 dark:text-amber-400" strokeWidth={2} />
                </div>
              </div>
              <span className="text-xl font-serif font-semibold text-stone-800 dark:text-stone-100 hidden sm:block tracking-tight" style={{fontFamily: "'Lora', serif"}}>
                Knowledge Café
              </span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2.5">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-all duration-300 shadow-sm"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-600" />
              ) : (
                <Moon className="w-5 h-5 text-stone-700" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-800 border border-stone-200/50 dark:border-stone-700/50 shadow-sm">
              <User className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              <span className="text-sm font-medium text-stone-700 dark:text-stone-300">
                {user?.email}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="hidden lg:flex gap-2 px-4 py-2.5 rounded-2xl bg-rose-100/60 dark:bg-rose-900/20 hover:bg-rose-200/80 dark:hover:bg-rose-800/30 text-rose-700 dark:text-rose-400 font-medium transition-all duration-300 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-stone-900/20 backdrop-blur-sm z-30 lg:hidden cursor-default"
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
          } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full backdrop-blur-2xl bg-white/70 dark:bg-stone-950/70 border-r border-stone-200/40 dark:border-stone-700/40 transition-all duration-500 flex flex-col shadow-2xl lg:shadow-none`}
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-stone-200/40 dark:border-stone-700/40">
            <h2 className="text-lg font-serif font-semibold text-stone-800 dark:text-stone-100" style={{fontFamily: "'Lora', serif"}}>
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-2xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-all"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-stone-600 dark:text-stone-400" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4 border-b border-stone-200/40 dark:border-stone-700/40">
            <Button className="w-full gap-2.5 bg-gradient-to-r from-amber-500/90 to-orange-500/90 hover:from-amber-600 hover:to-orange-600 dark:from-amber-600/80 dark:to-orange-600/80 dark:hover:from-amber-600 dark:hover:to-orange-600 text-white font-medium rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 py-6 text-base">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span className="font-serif" style={{fontFamily: "'Lora', serif"}}>New Conversation</span>
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
            <h3 className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-widest mb-3 px-3 flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" />
              Recent
            </h3>
            <div className="space-y-2">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className="w-full text-left p-4 rounded-3xl bg-gradient-to-br from-stone-50 to-amber-50/30 dark:from-stone-900/50 dark:to-stone-900/30 hover:from-amber-50/80 hover:to-orange-50/50 dark:hover:from-stone-800/60 dark:hover:to-stone-800/40 border border-stone-200/30 dark:border-stone-700/30 hover:border-amber-300/50 dark:hover:border-amber-700/30 transition-all duration-300 group shadow-sm hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <BookMarked className="w-4.5 h-4.5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0 group-hover:text-orange-600 dark:group-hover:text-amber-400 transition-colors" strokeWidth={2} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate mb-1.5 group-hover:text-amber-900 dark:group-hover:text-amber-100">
                        {conv.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
                        <span>{conv.message_count} messages</span>
                        <span className="text-stone-400 dark:text-stone-600">•</span>
                        <span>
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
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-stone-200/40 dark:border-stone-700/40">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-3xl bg-gradient-to-br from-stone-100 to-amber-50/50 dark:from-stone-800/60 dark:to-stone-800/40 hover:from-amber-100/80 hover:to-orange-100/60 dark:hover:from-stone-700/70 dark:hover:to-stone-700/50 text-stone-700 dark:text-stone-200 font-medium transition-all duration-300 shadow-sm hover:shadow-md border border-stone-200/30 dark:border-stone-700/30"
            >
              <FileText className="w-4 h-4" />
              <span>Your Library</span>
            </Link>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className="animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  {msg.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[80%] relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 dark:from-amber-600/5 dark:to-orange-600/5 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 dark:from-amber-600/90 dark:to-orange-600/90 text-white rounded-[2rem] rounded-br-lg px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                          <p className="text-sm leading-relaxed font-medium" style={{fontFamily: "'Source Serif Pro', serif"}}>
                            {msg.content}
                          </p>
                          <p className="text-xs text-white/75 mt-2.5">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : msg.content ? (
                    /* Assistant Message - Only show if there's content */
                    <div className="flex justify-start">
                      <div className="max-w-[80%] relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-stone-300/10 to-amber-300/10 dark:from-stone-700/10 dark:to-amber-700/10 rounded-[2rem] blur-xl group-hover:blur-2xl transition-all duration-500" />
                        <div className="relative backdrop-blur-xl bg-white/80 dark:bg-stone-900/80 rounded-[2rem] rounded-tl-lg px-6 py-5 shadow-lg border border-stone-200/40 dark:border-stone-700/30 hover:shadow-xl transition-all duration-300">
                          <MarkdownContent content={msg.content} />
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 pt-3 border-t border-stone-200/50 dark:border-stone-700/50">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-4 space-y-2.5">
                            <p className="text-xs font-semibold text-stone-600 dark:text-stone-400 uppercase tracking-widest flex items-center gap-2 px-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
                              Referenced sources
                            </p>
                            <div className="grid gap-2.5">
                              {msg.sources.map((source) => (
                                <div
                                  key={`${source.document_name}-${source.chunk_index}`}
                                  className="backdrop-blur-xl bg-gradient-to-br from-amber-50/80 to-orange-50/60 dark:from-stone-800/60 dark:to-amber-900/20 rounded-3xl p-4 border border-amber-200/40 dark:border-amber-700/20 hover:border-amber-300/60 dark:hover:border-amber-600/30 transition-all duration-300 cursor-pointer group/source shadow-sm hover:shadow-md"
                                >
                                  <div className="flex items-start gap-3.5">
                                    <div className="p-2.5 bg-gradient-to-br from-amber-400 to-orange-500 dark:from-amber-600/80 dark:to-orange-600/80 rounded-2xl shadow-md">
                                      <FileText className="w-4 h-4 text-white" strokeWidth={2} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-stone-800 dark:text-stone-100 truncate mb-1.5">
                                        {source.document_name}
                                      </p>
                                      <div className="flex items-center gap-2.5 text-xs">
                                        <span className="text-stone-600 dark:text-stone-400">
                                          Section {source.chunk_index}
                                        </span>
                                        <span className="text-stone-400 dark:text-stone-600">•</span>
                                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                                          {(
                                            source.relevance_score * 100
                                          ).toFixed(0)}
                                          % match
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}

              {/* Streaming Indicator */}
              {isStreaming && (
                <div className="flex justify-start">
                  <div className="backdrop-blur-xl bg-white/80 dark:bg-stone-900/80 rounded-[2rem] rounded-tl-lg px-6 py-4 shadow-lg border border-stone-200/40 dark:border-stone-700/30">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-600 rounded-full animate-pulse" />
                        <div
                          className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-600 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-600 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-sm text-stone-600 dark:text-stone-300 font-medium">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="backdrop-blur-2xl bg-white/70 dark:bg-stone-950/70 border-t border-stone-200/40 dark:border-stone-700/40 p-4 sm:p-6 shadow-2xl">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 to-orange-200/20 dark:from-amber-900/10 dark:to-orange-900/10 rounded-3xl blur-xl group-focus-within:blur-2xl transition-all duration-500" />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask me anything..."
                    rows={1}
                    className="relative w-full px-6 py-4 text-base bg-gradient-to-br from-stone-50 to-amber-50/30 dark:from-stone-900/80 dark:to-stone-900/60 border border-stone-200/50 dark:border-stone-700/40 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/50 dark:focus:ring-amber-600/50 text-stone-800 dark:text-stone-100 placeholder:text-stone-400 dark:placeholder:text-stone-500 transition-all duration-300 shadow-md focus:shadow-lg backdrop-blur-xl"
                    style={{
                      minHeight: "58px",
                      maxHeight: "200px",
                      fontFamily: "'Source Serif Pro', serif",
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isStreaming}
                  className="relative h-[58px] px-6 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 dark:from-amber-600/90 dark:to-orange-600/90 dark:hover:from-amber-600 dark:hover:to-orange-600 disabled:from-stone-400 disabled:to-stone-500 disabled:cursor-not-allowed text-white rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 disabled:shadow-none hover:scale-105 active:scale-95"
                >
                  {isStreaming ? (
                    <div className="w-5 h-5 border-2.5 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" strokeWidth={2.5} />
                  )}
                </Button>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-3.5 hidden sm:block text-center">
                Press Enter to send • Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(217 119 6 / 0.3), rgb(234 88 12 / 0.3));
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(217 119 6 / 0.5), rgb(234 88 12 / 0.5));
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, rgb(217 119 6 / 0.2), rgb(234 88 12 / 0.2));
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, rgb(217 119 6 / 0.4), rgb(234 88 12 / 0.4));
        }
      `}</style>
    </div>
  );
}
