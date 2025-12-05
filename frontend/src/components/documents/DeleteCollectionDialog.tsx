/**
 * Delete Collection Confirmation Dialog - Archive Vault Warning
 * Collection deletion confirmation with refined warning aesthetic
 * Fonts: Space Grotesk (headings), Inter (body), Fira Code (stats)
 */

import { AlertTriangle, FolderOpen, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface DeleteCollectionDialogProps {
  isOpen: boolean;
  collectionName: string;
  documentCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

export function DeleteCollectionDialog({
  isOpen,
  collectionName,
  documentCount,
  onConfirm,
  onCancel,
  isPending = false,
}: DeleteCollectionDialogProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    if (isPending) return;
    setIsAnimatingOut(true);
    setTimeout(() => {
      onCancel();
      setIsAnimatingOut(false);
    }, 200);
  }, [onCancel, isPending]);

  const handleConfirm = useCallback(() => {
    if (confirmText.toUpperCase() === "DELETE" && !isPending) {
      onConfirm();
    }
  }, [confirmText, onConfirm, isPending]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleCancel]);

  if (!isOpen) return null;

  const isDeleteEnabled = confirmText.toUpperCase() === "DELETE" && !isPending;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${
        isAnimatingOut ? "animate-fadeOut" : "animate-fadeIn"
      }`}
    >
      {/* Backdrop */}
      <button
        type="button"
        onClick={handleCancel}
        className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-default"
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md bg-white dark:bg-slate-900 border-2 border-orange-200 dark:border-orange-900 rounded-xl shadow-2xl overflow-hidden ${
          isAnimatingOut ? "animate-scaleOut" : "animate-scaleIn"
        }`}
        style={{
          boxShadow:
            "0 0 60px rgba(234, 88, 12, 0.15), 0 0 120px rgba(234, 88, 12, 0.05)",
        }}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>

        {/* Header */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-orange-50 dark:from-orange-950/20 to-transparent px-6 py-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-orange-100 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-900 rounded-lg">
              <AlertTriangle className="w-7 h-7 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk'] tracking-tight mb-1">
                Delete Collection?
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
                This action cannot be undone
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative px-6 py-6 space-y-5">
          {/* Collection Info */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                <FolderOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter'] mb-0.5">
                  Collection name
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk'] tracking-tight truncate">
                  {collectionName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Fira_Code'] tabular-nums">
                {documentCount}
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
                {documentCount === 1 ? "document" : "documents"} in this
                collection
              </span>
            </div>
          </div>

          {/* Warning messages */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-['Inter']">
                The collection will be permanently deleted
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-['Inter']">
                <strong className="font-semibold">
                  Documents will be preserved
                </strong>{" "}
                and moved to "No Collection"
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-slate-700 dark:text-slate-300 font-['Inter']">
                You can still access all documents from the dashboard
              </p>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2.5">
            <label
              htmlFor="delete-collection-confirm"
              className="block text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Inter']"
            >
              Type{" "}
              <span className="text-orange-600 dark:text-orange-400 font-['Fira_Code']">
                DELETE
              </span>{" "}
              to confirm
            </label>
            <input
              id="delete-collection-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 font-['Fira_Code'] text-sm rounded-lg focus:outline-none focus:border-orange-500 dark:focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isDeleteEnabled) {
                  handleConfirm();
                }
              }}
            />
            {confirmText && !isDeleteEnabled && (
              <p className="text-xs text-orange-600 dark:text-orange-400 font-['Inter'] flex items-center gap-1.5">
                <span className="w-1 h-1 bg-orange-500 rounded-full animate-pulse" />
                Please type exactly "DELETE" to confirm
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-lg transition-all font-['Inter'] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isDeleteEnabled}
            className={`flex-1 px-4 py-2.5 font-bold text-sm rounded-lg transition-all font-['Inter'] ${
              isDeleteEnabled
                ? "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/30 hover:shadow-xl hover:shadow-orange-900/40 hover:scale-[1.02] active:scale-[0.98]"
                : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
            }`}
          >
            {isPending
              ? "Deleting..."
              : isDeleteEnabled
                ? "Delete Collection"
                : "Locked"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyans scaleOut {
          from {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          to {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 200ms ease-out;
        }

        .animate-fadeOut {
          animation: fadeOut 200ms ease-in;
        }

        .animate-scaleIn {
          animation: scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scaleOut {
          animation: scaleOut 200ms cubic-bezier(0.7, 0, 0.84, 0);
        }
      `}</style>
    </div>
  );
}
