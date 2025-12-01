/**
 * Chat Page - Modern SaaS Dashboard
 * Clean, professional interface inspired by modern business dashboards
 * Fonts: DM Sans (UI), Inter (body), SF Pro Display (headings)
 * Color: Subtle blues, grays, white space, minimal accents
 */

import {
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
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MarkdownContent } from "../components/chat/MarkdownContent";
import { Button } from "../components/ui/button";
import { useChatStream } from "../hooks/useChatStream";
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
    <div className="h-screen flex flex-col bg-white dark:bg-slate-950">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center justify-between px-4 sm:px-6 h-16">
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
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" strokeWidth={2} />
              </div>
              <span className="text-lg font-semibold text-slate-900 dark:text-white font-['DM_Sans'] hidden sm:block">
                Chat
              </span>
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-slate-400" />
              ) : (
                <Moon className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {/* User Menu - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span className="text-sm text-slate-700 dark:text-slate-300 font-['Inter']">
                {user?.email}
              </span>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="hidden lg:flex gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-['DM_Sans']"
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
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden cursor-default"
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
          } lg:translate-x-0 fixed lg:relative z-40 w-72 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-transform duration-300 flex flex-col`}
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white font-['DM_Sans']">
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-4">
            <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-['DM_Sans'] font-medium shadow-sm">
              <Plus className="w-4 h-4" />
              New Chat
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto px-3">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-3 font-['DM_Sans']">
              Recent
            </h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate font-['Inter'] group-hover:text-slate-900 dark:group-hover:text-white">
                        {conv.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
                          {conv.message_count} messages
                        </span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-['DM_Sans'] transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Documents</span>
            </Link>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-900">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 sm:p-6 relative"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="animate-in fade-in slide-in-from-bottom-2 duration-500"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {msg.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                        <p className="text-sm leading-relaxed font-['Inter']">
                          {msg.content}
                        </p>
                        <p className="text-xs text-blue-100 mt-2 font-['Inter']">
                          {msg.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ) : msg.content ? (
                    /* Assistant Message - Only show if there's content */
                    <div className="flex justify-start">
                      <div className="max-w-[85%]">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                          <MarkdownContent content={msg.content} />
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-['Inter']">
                            {msg.timestamp.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-['DM_Sans']">
                              Sources
                            </p>
                            <div className="grid gap-2">
                              {msg.sources.map((source) => (
                                <div
                                  key={`${source.document_name}-${source.chunk_index}`}
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded">
                                      <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate font-['Inter']">
                                        {source.document_name}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter']">
                                          Chunk #{source.chunk_index}
                                        </span>
                                        <span className="text-xs text-slate-300 dark:text-slate-600">
                                          •
                                        </span>
                                        <span className="text-xs font-medium text-green-600 dark:text-green-400 font-['Inter']">
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
                  <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-['Inter'] ml-1">
                        Typing...
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
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 font-['Inter'] transition-all"
                    style={{
                      minHeight: "48px",
                      maxHeight: "200px",
                    }}
                  />
                </div>
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isStreaming}
                  className="h-12 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-['DM_Sans'] font-medium shadow-sm"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
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
