/**
 * Document Status Provider Component
 *
 * Initializes useDocumentStatusUpdates hook globally for all authenticated pages.
 * This ensures SSE connection is active and document status updates are received
 * across all pages without needing to initialize the hook in each component.
 *
 * Should wrap all authenticated routes in App.tsx.
 */

import type React from "react";
import { useDocumentStatusUpdates } from "../../hooks/useDocumentStatusUpdates";

interface DocumentStatusProviderProps {
  children: React.ReactNode;
}

export function DocumentStatusProvider({
  children,
}: DocumentStatusProviderProps) {
  // Initialize SSE + polling for document status updates
  useDocumentStatusUpdates();

  // Simply render children - the hook handles everything
  return <>{children}</>;
}
