/**
 * Chat Page - Conversation Hub with Real Backend Integration
 * Clean, modern chat interface with OKLCH purple theme
 * Fonts: Geist (sans), Geist Mono (mono)
 * Color: Purple OKLCH unified design system
 * Style: Zero-distraction, conversation-focused
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
import type { ChatMessage } from "../types/api";

interface DisplayMessage extends ChatMessage {
  id: string;
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

  // Track newly created conversations to prevent loading blink on URL transition
  const newlyCreatedConversationRef = useRef<string | null>(null);

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
        }),
      );
      setMessages(displayMessages);

      // Clear the newly created conversation ref after data loads
      // This restores normal loading behavior for subsequent navigation
      if (
        newlyCreatedConversationRef.current === conversationData.conversation_id
      ) {
        newlyCreatedConversationRef.current = null;
      }
    } else if (!conversationId) {
      // New conversation - clear messages
      setMessages([]);
      // Clear ref when starting new conversation
      newlyCreatedConversationRef.current = null;
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
      timestamp: new Date().toISOString(),
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
      timestamp: new Date().toISOString(),
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
                  sources: sources as typeof msg.sources,
                }
              : msg,
          ),
        );

        // If this was a new conversation, update URL with conversation_id
        if (!conversationId && newConversationId) {
          // Track this conversation as newly created to skip loading screen
          newlyCreatedConversationRef.current = newConversationId;
          // Use replace to avoid browser history pollution and smooth transition
          setSearchParams(
            { conversation: newConversationId },
            { replace: true },
          );
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
  // Skip loading for newly created conversations to prevent blink on URL transition
  const isJustCreated = newlyCreatedConversationRef.current === conversationId;
  if (conversationId && conversationLoading && !isJustCreated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-sans">
            Loading conversation...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
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
          } fixed lg:relative z-40 w-64 h-full border-r border-border bg-card transition-all duration-300 flex flex-col shadow-xl lg:shadow-none overflow-hidden`}
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground font-sans">
              Conversations
            </h2>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-6 border-b border-border">
            <Button
              onClick={handleNewChat}
              className="w-full gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 py-6 font-sans"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
              <span>New Chat</span>
            </Button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 font-sans">
              Recent
            </h3>

            {conversationsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
                          ? "bg-primary/10 dark:bg-primary/20 border-primary/50"
                          : "hover:bg-muted border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <MessageSquare
                          className={`w-4 h-4 mt-0.5 flex-shrink-0 transition-colors ${
                            conversationId === conv.conversation_id
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-primary"
                          }`}
                          strokeWidth={2}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate mb-1 font-sans">
                            {conv.last_message || "New conversation"}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                            <span>{conv.message_count} msgs</span>
                            <span className="text-muted-foreground">•</span>
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
              <p className="text-sm text-muted-foreground text-center py-8 font-sans">
                No conversations yet.
                <br />
                Start chatting below!
              </p>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-6 border-t border-border space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-sans transition-all hover:scale-[1.02]"
            >
              <HardDrive className="w-5 h-5" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/documents"
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted text-foreground font-sans transition-all hover:scale-[1.02]"
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
            <div className="bg-primary/10 dark:bg-primary/20 border-b border-primary/50 px-6 py-3">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary font-sans">
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
                  className="text-xs text-primary hover:text-primary/80 font-medium font-sans transition-colors"
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
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 font-sans">
                      Start a Conversation
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300 font-sans">
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
                        <div className="bg-primary text-primary-foreground rounded-xl rounded-br-none px-5 py-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <p className="text-sm leading-relaxed font-sans whitespace-pre-wrap">
                            {msg.content}
                          </p>
                          <p className="text-xs text-primary-foreground/70 mt-2 font-mono tabular-nums">
                            {new Date(
                              msg.timestamp || Date.now(),
                            ).toLocaleTimeString([], {
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
                        <div className="bg-card border border-border rounded-xl rounded-tl-none px-5 py-4 shadow-md hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
                              AI Assistant
                            </span>
                          </div>
                          <div className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-sans prose-p:font-sans prose-a:text-primary prose-code:font-mono">
                            <MarkdownContent content={msg.content} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border font-mono tabular-nums">
                            {new Date(
                              msg.timestamp || Date.now(),
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>

                        {/* Source Citations */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 font-sans">
                              <FileText className="w-3.5 h-3.5" />
                              Sources
                            </p>
                            <div className="grid gap-2">
                              {msg.sources.map((source, idx) => (
                                <div
                                  key={`${source.filename}-${source.chunk_index}-${idx}`}
                                  className="bg-muted rounded-lg p-3 border border-border hover:border-primary/50 dark:hover:border-primary/50 transition-all duration-300 cursor-pointer"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
                                      <FileText
                                        className="w-3.5 h-3.5 text-primary"
                                        strokeWidth={2}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate mb-1 font-sans">
                                        {source.filename}
                                      </p>
                                      <div className="flex items-center gap-2 text-xs font-mono">
                                        <span className="text-muted-foreground">
                                          chunk {source.chunk_index}
                                        </span>
                                        <span className="text-muted-foreground">
                                          •
                                        </span>
                                        <span className="font-semibold text-primary tabular-nums">
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
                  <div className="bg-card border border-border rounded-xl rounded-tl-none px-5 py-4 shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="w-2 h-2 bg-primary rounded-full animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground font-sans">
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
          <div className="border-t border-border bg-card p-6">
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
                    className="w-full h-[44px] px-4 py-[10px] text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground transition-all font-sans leading-[1.2] box-border"
                  />
                </div>

                {/* Send Button */}
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isStreaming}
                  className="!h-[44px] !min-h-[44px] !py-0 px-5 flex items-center justify-center bg-primary hover:bg-primary/90 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-primary-foreground rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:shadow-none font-sans font-semibold flex-shrink-0"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
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
                    collections={collections.map((c) => ({
                      collection_id: c.collection_id,
                      name: c.name,
                      document_count: c.document_count,
                    }))}
                    selectedCollectionId={selectedCollectionId}
                    onSelectCollection={setSelectedCollectionId}
                  />
                </div>
                {/* Help Text */}
                <p className="text-xs text-muted-foreground hidden sm:block font-sans">
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
