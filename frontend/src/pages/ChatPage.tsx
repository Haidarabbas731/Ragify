import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ApiKeyRequiredDialog } from "@/components/chat/ApiKeyRequiredDialog";
import { Composer } from "@/components/chat/Composer";
import type { DisplayMessage } from "@/components/chat/MessageBubble";
import { MessageList } from "@/components/chat/MessageList";
import { useAiSettings } from "@/hooks/useAiSettings";
import { useChatStream } from "@/hooks/useChatStream";
import { useCollections } from "@/hooks/useCollections";
import {
  useAddConversationToHistory,
  useConversation,
} from "@/hooks/useConversations";
import { useAuthStore } from "@/store/authStore";

/** Chat with your documents. Lives in the app shell; history is in the sidebar. */
export function ChatPage() {
  const navigate = useNavigate();
  const { key: locationKey, state: locationState } = useLocation();
  const { conversationId } = useParams<{ conversationId: string }>();
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.user_id);
  const addToHistory = useAddConversationToHistory();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  // The dashboard ask bar can hand over a collection to search in.
  const requestedCollectionId =
    (locationState as { collectionId?: string | null } | null)?.collectionId ??
    null;
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    string | null
  >(requestedCollectionId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tracks a conversation created mid-stream so the URL change doesn't flash a loading state.
  const newlyCreatedConversationRef = useRef<string | null>(null);

  const { data: conversationData, isLoading: conversationLoading } =
    useConversation(conversationId);
  const { data: collectionsData } = useCollections();
  const collections = collectionsData?.collections || [];
  const { isStreaming, currentResponse, activity, streamChat } =
    useChatStream();

  // Chat needs a key: the user's own, or the server's default. If neither exists, ask.
  const { data: aiSettings } = useAiSettings();
  const needsApiKey = Boolean(
    aiSettings && !aiSettings.has_key && !aiSettings.default_available,
  );
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  useEffect(() => {
    if (needsApiKey) setKeyDialogOpen(true);
  }, [needsApiKey]);

  // Show a saved conversation's messages once they load.
  useEffect(() => {
    if (conversationData?.messages) {
      setMessages(
        conversationData.messages.map((msg, index) => ({
          ...msg,
          id: `${conversationData.conversation_id}-${index}`,
        })),
      );
      if (
        newlyCreatedConversationRef.current === conversationData.conversation_id
      ) {
        newlyCreatedConversationRef.current = null;
      }
    }
  }, [conversationData]);

  // A new chat (including clicking "New chat" while already on /chat) starts empty.
  // biome-ignore lint/correctness/useExhaustiveDependencies: locationKey re-runs this on every New chat click
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setSelectedCollectionId(requestedCollectionId);
      newlyCreatedConversationRef.current = null;
    }
  }, [conversationId, locationKey]);

  // Typing anywhere on the page focuses the message box.
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
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
        e.key.startsWith("F")
      ) {
        return;
      }
      if (e.key.length === 1) textareaRef.current?.focus();
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handlePickPrompt = (prompt: string) => {
    setMessage(prompt);
    textareaRef.current?.focus();
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    if (needsApiKey) {
      setMessage(text);
      setKeyDialogOpen(true);
      return;
    }

    const userMessage: DisplayMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: DisplayMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setMessage("");

    await streamChat({
      query: userMessage.content,
      conversationId: conversationId || undefined,
      collectionId: selectedCollectionId || undefined,
      onChunk: (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: msg.content + chunk }
              : msg,
          ),
        );
      },
      onComplete: (fullResponse, sources, newConversationId) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? { ...msg, content: fullResponse, sources }
              : msg,
          ),
        );

        if (!conversationId && newConversationId) {
          newlyCreatedConversationRef.current = newConversationId;
          const now = new Date().toISOString();
          // Show the new chat in the sidebar right away; the refetch below confirms it.
          addToHistory({
            conversation_id: newConversationId,
            user_id: userId ?? "",
            message_count: 2,
            created_at: now,
            updated_at: now,
            last_message: userMessage.content.slice(0, 100),
            client_added: true,
          });
          navigate(`/chat/${newConversationId}`, { replace: true });
        }

        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      },
      onError: (error) => {
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

  // A question typed on the dashboard arrives as router state and is sent once.
  // The nonce is remembered for the session so reloading /chat doesn't send it again.
  const prefill = (locationState as { prefill?: string; nonce?: number } | null)
    ?.prefill;
  const prefillNonce = (locationState as { nonce?: number } | null)?.nonce;
  const prefillSent = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: send once per arrival
  useEffect(() => {
    if (!prefill || conversationId || !aiSettings || prefillSent.current)
      return;
    const seen = sessionStorage.getItem("chat:prefill-nonce");
    if (seen === String(prefillNonce)) return;
    prefillSent.current = true;
    sessionStorage.setItem("chat:prefill-nonce", String(prefillNonce));
    void sendMessage(prefill);
  }, [prefill, prefillNonce, conversationId, aiSettings]);

  const isJustCreated = newlyCreatedConversationRef.current === conversationId;
  const loadingConversation =
    Boolean(conversationId) && conversationLoading && !isJustCreated;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MessageList
        messages={messages}
        loading={loadingConversation}
        isStreaming={isStreaming}
        hasResponseText={Boolean(currentResponse)}
        activity={activity}
        onPickPrompt={handlePickPrompt}
      />
      <Composer
        value={message}
        onChange={setMessage}
        onSend={() => sendMessage(message)}
        isStreaming={isStreaming}
        collections={collections}
        collectionId={selectedCollectionId}
        onCollectionChange={setSelectedCollectionId}
        textareaRef={textareaRef}
      />
      <ApiKeyRequiredDialog
        open={keyDialogOpen}
        onClose={() => setKeyDialogOpen(false)}
      />
    </div>
  );
}
