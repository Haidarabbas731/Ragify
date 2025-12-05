/**
 * Chat Page - Conversation Hub with Real Backend Integration
 * Clean, modern chat interface matching the dashboard design system
 * Fonts: Space Grotesk (headings), Inter (UI), Fira Code (metadata)
 * Color: Purple/indigo palette complementing dashboard's blue-purple theme
 * Style: Clean, professional, conversation-focused
 * Features: Real-time streaming, conversation management, collection filtering
 */

import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  FolderOpen,
  HardDrive,
  Loader2,
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
  Trash2,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { CollectionFilter } from "../components/chat/CollectionFilter";
import { DeleteConfirmDialog } from "../components/chat/DeleteConfirmDialog";
import { MarkdownContent } from "../components/chat/MarkdownContent";
import { Button } from "../components/ui/button";
import { useDarkMode } from "../contexts/DarkModeContext";
import { useChatStream } from "../hooks/useChatStream";
import { useCollections } from "../hooks/useCollections";
import {
  useConversation,
  useConversations,
  useDeleteConversation,
} from "../hooks/useConversations";
import { useAuthStore } from "../store/authStore";
import type { ChatMessage, SourceCitation } from "../types/api";

interface DisplayMessage extends ChatMessage {
  id: string;
  timestamp: Date;
  sources?: {
    filename: string;
    chunk_index: number;
    relevance_score: number;
  }[];
}

export function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const queryClient = useQueryClient();

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<
    string | null
  >(null);

  // Get conversation ID from URL
  const conversationId = searchParams.get("conversation");

  // Refs for auto-scroll and input
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
 
  // Backend hooks
  const { data: conversations, isLoading: conversationsLoading } =
    useConversations({ limit: 50, offset: 0 });
  const { data: conversationData, isLoading: conversationLoading } =
    useConversation(conversationId || undefined);
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.collections || [];
  const deleteConversationMutation = useDeleteConversation();

  // Streaming hook
  const { isStreaming, streamChat } = useChatStream();

  // Load conversation messages when conversation data changes
  useEffect(() => {
    if (conversationData?.messages) {
      const displayMessages: DisplayMessage[] = conversationData.messages.map(
        (msg, index) => ({
          ...msg,
          id: `${conversationData.conversation_id}-${index}`,
          timestamp: new Date(msg.timestamp || Date.now()),
          // Map sources to display format
          sources: msg.sources?.map((s) => ({
            filename: s.filename,
            chunk_index: s.chunk_index,
            relevance_score: s.relevance_score,
          })),
        }),
      );
      setMessages(displayMessages);
    } else if (!conversationId) {
      // New conversation - clear messages
      setMessages([]);
    }
  }, [conversationData, conversationId]);

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

  // Auto-scroll when messages change or streaming
  useEffect(() => {
    if (isNearBottom || isStreaming) {
      scrollToBottom(true);
    }
  }, [isStreaming, isNearBottom, scrollToBottom]);

  // Auto-focus textarea when typing anywhere on page (ChatGPT-like behavior)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input/textarea already
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore modifier keys, special keys, and shortcuts
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key === "Escape" ||
        e.key === "Tab" ||
        e.key === "Enter" ||
        e.key === "Shift" ||
        e.key === "Control" ||
        e.key === "Alt" ||
        e.key === "Meta" ||
        e.key.startsWith("Arrow") ||
        e.key.startsWith("F") // F1-F12
      ) {
        return;
      }

      // Focus textarea for any printable character
      if (e.key.length === 1 && textareaRef.current) {
        textareaRef.current.focus();
        // Let the character be typed naturally
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Initial scroll to bottom on mount
  useEffect(() => {
    scrollToBottom(false);
  }, [scrollToBottom]);

  // Attach scroll listener
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollPosition);
      checkScrollPosition();
      return () => container.removeEventListener("scroll", checkScrollPosition);
    }
  }, [checkScrollPosition]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNewChat = () => {
    // Clear conversation ID from URL
    setSearchParams({});
    setMessages([]);
    setSelectedCollectionId(null);
  };

  const handleSelectConversation = (convId: string) => {
    setSearchParams({ conversation: convId });
    setMobileSidebarOpen(false);
  };

  // Open delete confirmation dialog
  const handleDeleteConversation = (convId: string) => {
    setConversationToDelete(convId);
    setDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    if (!conversationToDelete) return;

    try {
      await deleteConversationMutation.mutateAsync(conversationToDelete);
      // If we're viewing this conversation, clear it
      if (conversationId === conversationToDelete) {
        handleNewChat();
      }
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setConversationToDelete(null);
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isStreaming) return;

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: "user",
      content: message.trim(),
      timestamp: new Date(),
    };

    // Add user message to chat
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");

    // Create placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: DisplayMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    // Stream the response
    await streamChat({
      query: userMessage.content,
      conversationId: conversationId || undefined,
      collectionId: selectedCollectionId || undefined,
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
      onComplete: (fullResponse, sources, newConversationId) => {
        // Update with final response and sources
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content: fullResponse,
                  sources: sources?.map((s: SourceCitation) => ({
                    filename: s.filename,
                    chunk_index: s.chunk_index,
                    relevance_score: s.relevance_score,
                  })),
                }
              : msg,
          ),
        );

        // If this was a new conversation, update URL with conversation_id
        if (!conversationId && newConversationId) {
          setSearchParams({ conversation: newConversationId });
        }

        // Always invalidate conversations cache to update message counts in sidebar
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
        toast.error(error);
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Show loading state for initial conversation load
  if (conversationId && conversationLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 dark:text-purple-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-['Inter']">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

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
            {/* Dark Mode Toggle - Hidden on mobile */}
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

            {/* Logout Button - Hidden on mobile */}
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
            <Button
              onClick={handleNewChat}
              className="w-full gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 py-6 font-['Inter']"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 font-['Inter']">
              Recent
            </h3>

            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : conversations && conversations.length > 0 ? (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <div key={conv.conversation_id} className="group relative">
                    <button
                      type="button"
                      onClick={() =>
                        handleSelectConversation(conv.conversation_id)
                      }
                      className={`w-full text-left p-4 rounded-lg transition-all duration-300 border ${
                        conversationId === conv.conversation_id
                          ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
                            conversationId === conv.conversation_id
                              ? "text-purple-500 dark:text-purple-400"
                              : "text-slate-400 dark:text-slate-500 group-hover:text-purple-500 dark:group-hover:text-purple-400"
                          }`}
                          strokeWidth={2}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate mb-1 font-['Inter']">
                            {conv.last_message || "New conversation"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-['Fira_Code']">
                            <span>{conv.message_count} msgs</span>
                            <span className="text-slate-400 dark:text-slate-600">
                              •
                            </span>
                            <span>
                              {new Date(conv.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv.conversation_id);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-950 transition-all"
                      aria-label="Delete conversation"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8 font-['Inter']">
                No conversations yet.
                <br />
                Start chatting below!
              </p>
            )}
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
          {/* Active Filter Banner */}
          {selectedCollectionId && collections.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-950/30 border-b border-purple-200 dark:border-purple-800 px-6 py-3">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300 font-['Inter']">
                    Filtering by:{" "}
                    <span className="font-semibold">
                      {
                        collections.find(
                          (c) => c.collection_id === selectedCollectionId,
                        )?.name
                      }
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCollectionId(null)}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium font-['Inter'] transition-colors"
                >
                  Clear filter
                </button>
              </div>
            </div>
          )}

          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-6 custom-scrollbar"
          >
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.length === 0 && !isStreaming && (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3 font-['Space_Grotesk']">
                      Start a Conversation
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 font-['Inter']">
                      Ask me anything about your uploaded documents. I'll
                      provide accurate answers with source citations.
                    </p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className="animate-in fade-in duration-300">
                  {msg.role === "user" ? (
                    /* User Message */
                    <div className="flex justify-end">
                      <div className="max-w-[80%]">
                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl rounded-br-none px-5 py-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <p className="text-sm leading-relaxed font-['Inter'] whitespace-pre-wrap">
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
                    /* Assistant Message */
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
                              {msg.sources.map((source, idx) => (
                                <div
                                  key={`${source.filename}-${source.chunk_index}-${idx}`}
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
                                        {source.filename}
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
              {/* Input Row with Integrated Filter */}
              <div className="flex items-center gap-3">
                {/* Collection Filter on Left */}
                <div className="hidden sm:block flex-shrink-0">
                  <CollectionFilter
                    collections={collections.map((c) => ({
                      collection_id: c.collection_id,
                      name: c.name,
                      document_count: c.document_count,
                    }))}
                    selectedCollectionId={selectedCollectionId}
                    onSelectCollection={setSelectedCollectionId}
                  />
                </div>

                {/* Text Input */}
                <div className="flex-1 flex items-center">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask anything about your documents..."
                    rows={1}
                    className="w-full h-[44px] px-4 py-[10px] text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 dark:focus:border-purple-400 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 transition-all font-['Inter'] leading-[1.2] box-border"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isStreaming}
                  className="!h-[44px] !min-h-[44px] !py-0 px-5 flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-slate-700 dark:disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:shadow-none font-['Inter'] font-semibold flex-shrink-0"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" strokeWidth={2.5} />
                  )}
                </Button>
              </div>

              {/* Bottom Row: Filter on mobile + Help Text */}
              <div className="flex items-center justify-between mt-2">
                {/* Mobile Collection Filter */}
                <div className="sm:hidden">
                  <CollectionFilter
                    collections={
                      collections.map((c) => ({
                        collection_id: c.collection_id,
                        name: c.name,
                        document_count: c.document_count,
                      }))
                    }
                    selectedCollectionId={selectedCollectionId}
                    onSelectCollection={setSelectedCollectionId}
                  />
                </div>
                {/* Help Text */}
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block font-['Inter']">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
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

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Conversation?"
        message="This conversation will be permanently deleted. This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDeleting={deleteConversationMutation.isPending}
      />
    </div>
  );
}
