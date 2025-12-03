/**
 * Chat Page - Conversation Hub
 * Clean, modern chat interface matching the dashboard design system
 * Fonts: Space Grotesk (headings), Inter (UI), Fira Code (metadata)
 * Color: Purple/indigo palette complementing dashboard's blue-purple theme
 * Style: Clean, professional, conversation-focused
 * Features: Collapsible sidebar, collection filter
 */

import {
  FileText,
  FolderOpen,
  HardDrive,
  LogOut,
  Menu,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
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
import { useDarkMode } from "../contexts/DarkModeContext";
import { useChatStream } from "../hooks/useChatStream";
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

interface Collection {
  collection_id: string;
  name: string;
  document_count: number;
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

// Mock collections (will be replaced with real API data)
const _MOCK_COLLECTIONS: Collection[] = [
  { collection_id: "coll_1", name: "Research Papers", document_count: 15 },
  { collection_id: "coll_2", name: "Meeting Notes", document_count: 8 },
  { collection_id: "coll_3", name: "Technical Docs", document_count: 23 },
];

export function ChatPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const [sidebarOpen, setSidebarOpen] = useState(true); // Desktop sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Mobile sidebar state
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [currentConversationId] = useState<string | null>(null);

  // Collection filter state
  const [_selectedCollectionId, _setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [_filterDropdownOpen, _setFilterDropdownOpen] = useState(false);
  const _filterDropdownRef = useRef<HTMLDivElement>(null);

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
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 font-['Inter']">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
          {/* Left Side */}
          <div className="flex items-center gap-4">
            {/* Desktop Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <PanelLeftClose className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              ) : (
                <PanelLeftOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>

            {/* Logo & Brand */}
            <Link to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent font-['Space_Grotesk'] tracking-tight">
                Chat
              </span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
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

      {/* Mobile Overlay */}
      {mobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden cursor-default"
          onClick={() => setMobileSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileSidebarOpen(false);
          }}
          aria-label="Close sidebar"
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Conversation List */}
        <aside
          className={`${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 ${
            sidebarOpen ? "lg:w-64" : "lg:w-0"
          } fixed lg:relative z-40 w-64 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 flex flex-col shadow-xl lg:shadow-none overflow-hidden`}
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <Button className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 py-6 font-['Inter']">
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-['Inter']">
              Recent
            </h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className="w-full text-left p-4 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 group border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare
                      className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors"
                      strokeWidth={2}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mb-1 font-['Inter']">
                        {conv.title}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Fira_Code']">
                        <span>{conv.message_count} msgs</span>
                        <span className="text-slate-400 dark:text-slate-600">
                          •
                        </span>
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
          <div className="p-6 border-t border-slate-200 dark:border-slate-800 space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <HardDrive className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-['Inter'] transition-all hover:scale-[1.02]"
            >
              <FolderOpen className="w-5 h-5" />
              <span>Documents</span>
            </Link>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 custom-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className="animate-in fade-in duration-300">
                  {msg.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl rounded-br-none px-5 py-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <p className="text-sm leading-relaxed font-['Inter']">
                            {msg.content}
                          </p>
                          <p className="text-xs text-purple-100/70 mt-2 font-['Fira_Code'] tabular-nums">
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
                      <div className="max-w-[80%]">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl rounded-tl-none px-5 py-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-['Inter']">
                              AI Assistant
                            </span>
                          </div>
                          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-['Space_Grotesk'] prose-p:font-['Inter'] prose-a:text-purple-600 dark:prose-a:text-purple-400 prose-code:font-['Fira_Code']">
                            <MarkdownContent content={msg.content} />
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 font-['Fira_Code'] tabular-nums">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2 font-['Inter']">
                              <FileText className="w-3.5 h-3.5" />
                              Sources
                            </p>
                            <div className="grid gap-2">
                              {msg.sources.map((source) => (
                                <div
                                  key={`${source.document_name}-${source.chunk_index}`}
                                  className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all duration-300 cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-purple-100 dark:bg-purple-950 rounded-lg">
                                      <FileText
                                        className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400"
                                        strokeWidth={2}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mb-1 font-['Inter']">
                                        {source.document_name}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs font-['Fira_Code']">
                                        <span className="text-slate-500 dark:text-slate-400">
                                          chunk {source.chunk_index}
                                        </span>
                                        <span className="text-slate-400 dark:text-slate-600">
                                          •
                                        </span>
                                        <span className="font-semibold text-purple-600 dark:text-purple-400 tabular-nums">
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
                <div className="flex justify-start animate-in fade-in duration-300">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl rounded-tl-none px-5 py-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
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
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask anything about your documents..."
                    rows={1}
                    className="w-full px-4 py-3 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all font-['Inter']"
                    style={{
                      minHeight: "44px",
                      maxHeight: "200px",
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isStreaming}
                  className="h-[44px] px-5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:shadow-none font-['Inter'] font-semibold"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 hidden sm:block font-['Inter']">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </main>
      </div>

      <style>{`
        /* Custom Scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }

        /* Dark mode scrollbar */
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.3);
        }
        :global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.5);
        }
      `}</style>
    </div>
  );
}
