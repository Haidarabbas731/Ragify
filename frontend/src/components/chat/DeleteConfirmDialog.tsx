/**
 * Delete Confirmation Dialog Component
 * A polished, accessible confirmation dialog for destructive actions
 */

import { AlertTriangle, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  isDeleting?: boolean;
}

/**
 * DeleteConfirmDialog - A beautiful, accessible confirmation dialog
 *
 * Features:
 * - Smooth fade-in animation with backdrop blur
 * - Keyboard navigation (Escape to cancel, Enter to confirm)
 * - Focus trap for accessibility
 * - Loading state during deletion
 * - Matches app's purple/indigo theme
 */
export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Conversation?",
  message = "This conversation will be permanently deleted. This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isDeleting = false,
}: DeleteConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !isDeleting) {
        onConfirm();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm, isDeleting]);

  // Focus management
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
    >
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm" />

      {/* Dialog */}
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full animate-slideUp border border-slate-200 dark:border-slate-800"
        style={{
          boxShadow:
            "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              {/* Animated pulse ring */}
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
              <div className="relative flex items-center justify-center w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-full">
                <AlertTriangle
                  className="w-7 h-7 text-white"
                  strokeWidth={2.5}
                />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2
            id="dialog-title"
            className="text-xl font-bold text-slate-900 dark:text-slate-100 text-center mb-2 font-['Space_Grotesk']"
          >
            {title}
          </h2>

          {/* Message */}
          <p
            id="dialog-description"
            className="text-sm text-slate-600 dark:text-slate-400 text-center mb-6 font-['Inter'] leading-relaxed"
          >
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            {/* Cancel button */}
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 font-['Inter'] disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
            >
              {cancelText}
            </button>

            {/* Confirm button */}
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-200 font-['Inter'] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isDeleting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    role="img"
                    aria-label="Loading"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Deleting...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 rounded-b-2xl" />
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
