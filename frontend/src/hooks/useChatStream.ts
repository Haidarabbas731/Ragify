/**
 * Chat Streaming Hook
 * Handles Server-Sent Events (SSE) streaming for real-time chat responses
 */

import { useCallback, useRef, useState } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";

interface ChatStreamOptions {
  query: string;
  conversationId?: string;
  collectionId?: string;
  topK?: number;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string, sources: SourceCitation[]) => void;
  onError?: (error: string) => void;
}

interface SourceCitation {
  document_name: string;
  chunk_index: number;
  relevance_score: number;
}

interface ChatStreamState {
  isStreaming: boolean;
  currentResponse: string;
  error: string | null;
}

/**
 * Custom hook for streaming chat responses using SSE
 * Handles connection, parsing, and cleanup automatically
 */
export function useChatStream() {
  const [state, setState] = useState<ChatStreamState>({
    isStreaming: false,
    currentResponse: "",
    error: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const { token } = useAuthStore();

  /**
   * Start streaming a chat query
   */
  const streamChat = useCallback(
    async ({
      query,
      conversationId,
      collectionId,
      topK = 5,
      onChunk,
      onComplete,
      onError,
    }: ChatStreamOptions) => {
      // Reset state
      setState({
        isStreaming: true,
        currentResponse: "",
        error: null,
      });

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController();

      try {
        // Make streaming request
        const response = await fetch(`${api.defaults.baseURL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query,
            conversation_id: conversationId,
            collection_id: collectionId,
            top_k: topK,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            detail: "Unknown error occurred",
          }));
          throw new Error(errorData.detail || `HTTP ${response.status}`);
        }

        // Check if response body exists
        if (!response.body) {
          throw new Error("Response body is null");
        }

        // Read stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let sources: SourceCitation[] = [];

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          // Decode chunk
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            // SSE format: "data: {json}\n\n"
            if (line.startsWith("data: ")) {
              const dataStr = line.slice(6); // Remove "data: " prefix

              try {
                const data = JSON.parse(dataStr);

                // Handle different message types
                if (data.error) {
                  throw new Error(data.error);
                }

                if (data.done) {
                  // Stream complete
                  setState({
                    isStreaming: false,
                    currentResponse: fullResponse,
                    error: null,
                  });
                  onComplete?.(fullResponse, sources);
                  return;
                }

                if (data.chunk) {
                  // Append chunk to response
                  fullResponse += data.chunk;
                  setState((prev) => ({
                    ...prev,
                    currentResponse: fullResponse,
                  }));
                  onChunk?.(data.chunk);
                }

                // Store sources if provided
                if (data.sources) {
                  sources = data.sources;
                }
              } catch (parseError) {
                console.error("Failed to parse SSE data:", parseError);
              }
            }
          }
        }
      } catch (error) {
        // Handle abort
        if (error instanceof Error && error.name === "AbortError") {
          setState({
            isStreaming: false,
            currentResponse: "",
            error: "Request cancelled",
          });
          return;
        }

        // Handle other errors
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState({
          isStreaming: false,
          currentResponse: "",
          error: errorMessage,
        });
        onError?.(errorMessage);
      }
    },
    [token],
  );

  /**
   * Cancel ongoing stream
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isStreaming: false,
      currentResponse: "",
      error: null,
    });
  }, []);

  return {
    ...state,
    streamChat,
    cancelStream,
    reset,
  };
}
