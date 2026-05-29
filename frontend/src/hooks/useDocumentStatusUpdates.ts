/**
 * Hook for real-time document status updates via SSE + Polling fallback
 *
 * Hybrid Approach:
 * 1. Primary: EventSource (SSE) connection to /api/v1/documents/status-stream
 * 2. Fallback: Polling every 5s if SSE fails or unsupported
 * 3. Reconnection: Exponential backoff (1s → 3s → 9s → 10s max)
 *
 * Features:
 * - Automatic cache updates via React Query
 * - Toast notifications for status changes
 * - Connection state tracking (connected, polling, disconnected)
 * - Auto-cleanup on unmount
 */

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Document } from "../types/api";

interface DocumentStatusUpdate {
  document_id: string;
  status: "active" | "error";
  chunks_count: number;
  filename: string;
  processed_at: string;
  error_message?: string;
}

type ConnectionState = "connecting" | "connected" | "polling" | "disconnected";

interface UseDocumentStatusUpdatesReturn {
  connectionState: ConnectionState;
  lastUpdate: DocumentStatusUpdate | null;
}

const RECONNECT_DELAYS = [1000, 3000, 9000, 10000]; // Exponential backoff
const SSE_ENDPOINT = `${import.meta.env.VITE_API_URL}/documents/status-stream`;

export function useDocumentStatusUpdates(): UseDocumentStatusUpdatesReturn {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("connecting");
  const [lastUpdate, setLastUpdate] = useState<DocumentStatusUpdate | null>(
    null,
  );

  // Refs to persist across re-renders
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  /**
   * Update React Query cache with new document status
   */
  const updateDocumentCache = useCallback(
    (update: DocumentStatusUpdate) => {
      // Update individual document queries
      queryClient.setQueryData<Document>(
        ["document", update.document_id],
        (old: Document | undefined) => {
          if (!old) return old;
          return {
            ...old,
            status: update.status,
            chunks_count: update.chunks_count,
            processed_at: update.processed_at,
            error_message: update.error_message || null,
          };
        },
      );

      // Invalidate documents list to refresh (will show new status)
      console.log("[SSE] Invalidating documents query");
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      // Invalidate user stats to update counts and storage
      console.log("[SSE] Invalidating userStats query");
      queryClient.invalidateQueries({ queryKey: ["userStats"] });

      // Show toast notification
      console.log("[SSE] Showing toast for status:", update.status);
      if (update.status === "active") {
        toast.success(`${update.filename} processed successfully`, {
          description: `${update.chunks_count} chunks created`,
        });
        console.log("[SSE] Success toast triggered");
      } else if (update.status === "error") {
        toast.error(`❌ ${update.filename} processing failed`, {
          description: update.error_message || "Unknown error",
        });
        console.log("[SSE] Error toast triggered");
      }
      setLastUpdate(update);
    },
    [queryClient],
  );

  /**
   * Connect to SSE stream
   */
  const connectSSE = useCallback(() => {
    if (isUnmountedRef.current) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      console.warn("[SSE] No access token found");
      setConnectionState("disconnected");
      return;
    }

    try {
      // EventSource doesn't support custom headers, so we pass token as query param
      const url = `${SSE_ENDPOINT}?token=${token}`;
      console.log("[SSE] Connecting to:", SSE_ENDPOINT);
      const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        if (isUnmountedRef.current) return;
        console.log("[SSE] Connection opened successfully");
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0; // Reset on successful connection
      };

      eventSource.onmessage = (event) => {
        if (isUnmountedRef.current) return;

        try {
          const data = JSON.parse(event.data);
          console.log("[SSE] Received message:", data);

          // Handle errors from backend
          if (data.error) {
            console.error("[SSE] Error from server:", data.error);
            return;
          }

          // Handle document status updates
          if (data.document_id && data.status) {
            console.log("[SSE] Updating document cache:", data);
            updateDocumentCache(data as DocumentStatusUpdate);
          }
        } catch (error) {
          console.error("[SSE] Failed to parse message:", error);
        }
      };

      eventSource.onerror = (error) => {
        if (isUnmountedRef.current) return;

        console.error("[SSE] Connection error:", error);
        eventSource.close();
        setConnectionState("disconnected");

        // Check if token is expired before reconnecting
        const token = localStorage.getItem("access_token");
        if (!token) {
          window.location.href = "/login";
          return;
        }
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          if (payload.exp * 1000 < Date.now()) {
            localStorage.clear();
            window.location.href = "/login";
            return;
          }
        } catch {
          // Malformed token — let the Axios interceptor handle it
        }

        // Attempt reconnection with exponential backoff
        const delayIndex = Math.min(
          reconnectAttemptsRef.current,
          RECONNECT_DELAYS.length - 1,
        );
        const delay = RECONNECT_DELAYS[delayIndex];
        reconnectTimeoutRef.current = window.setTimeout(() => {
          reconnectAttemptsRef.current += 1;
          connectSSE();
        }, delay);
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("[SSE] Failed to create EventSource:", error);
      setConnectionState("polling");
    }
  }, [updateDocumentCache]);

  /**
   * Initialize connection on mount
   */
  useEffect(() => {
    isUnmountedRef.current = false;

    // Check if EventSource is supported
    if (typeof EventSource === "undefined") {
      console.warn("[SSE] EventSource not supported, falling back to polling");
      setConnectionState("polling");
      return;
    }

    connectSSE();

    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [connectSSE]); // connectSSE is now stable via useCallback

  return {
    connectionState,
    lastUpdate,
  };
}
