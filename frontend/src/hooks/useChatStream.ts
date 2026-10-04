/**
 * Chat Streaming Hook
 * Handles Server-Sent Events (SSE) streaming for real-time chat responses
 */

import { useCallback, useRef, useState } from "react";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import type { AgentStep, SourceCitation } from "../types/api";

interface ChatStreamOptions {
  query: string;
  conversationId?: string;
  collectionId?: string;
  topK?: number;
  onChunk?: (chunk: string) => void;
  /** Called with the full step list each time the agent starts or finishes a tool call. */
  onStep?: (steps: AgentStep[]) => void;
  onComplete?: (
    fullResponse: string,
    sources: SourceCitation[],
    conversationId: string,
  ) => void;
  onError?: (error: string) => void;
}

/** One JSON event from the chat SSE stream. */
interface StreamEvent {
  chunk?: string;
  done?: boolean;
  error?: string;
  conversation_id?: string;
  sources?: SourceCitation[];
  tool_call?: AgentStep;
  tool_result?: AgentStep;
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
  const { accessToken } = useAuthStore();

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
      onStep,
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
            Authorization: `Bearer ${accessToken}`,
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
        let conversationIdFromStream = "";
        let finished = false;
        const steps: AgentStep[] = [];
        // A network read can end mid-line; keep the unfinished part for the next read
        let buffer = "";

        while (!finished) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            // SSE format: "data: {json}\n\n"
            if (!line.startsWith("data: ")) continue;

            let data: StreamEvent;
            try {
              data = JSON.parse(line.slice(6));
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError);
              continue;
            }

            // Errors are thrown outside the parse guard so they reach the caller
            if (data.error) {
              throw new Error(data.error);
            }

            const step = data.tool_call ?? data.tool_result;
            if (step) {
              const index = steps.findIndex((s) => s.id === step.id);
              if (index === -1) steps.push(step);
              else steps[index] = step;
              onStep?.([...steps]);
            }

            if (data.chunk) {
              fullResponse += data.chunk;
              setState((prev) => ({
                ...prev,
                currentResponse: fullResponse,
              }));
              onChunk?.(data.chunk);
            }

            if (data.done) {
              if (data.conversation_id) {
                conversationIdFromStream = data.conversation_id;
              }
              if (data.sources) {
                sources = data.sources;
              }

              setState({
                isStreaming: false,
                currentResponse: fullResponse,
                error: null,
              });
              finished = true;
              onComplete?.(fullResponse, sources, conversationIdFromStream);
              break;
            }
          }
        }

        if (!finished) {
          throw new Error(
            "The connection closed before the answer finished. Please try again.",
          );
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
    [accessToken],
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
