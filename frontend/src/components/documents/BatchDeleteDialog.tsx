/**
 * Batch Delete Confirmation Dialog - Mission Authorization Screen
 * Tactical confirmation for batch delete operations
 * Fonts: Rajdhani (display), JetBrains Mono (monospace)
 */

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

interface BatchDeleteDialogProps {
  isOpen: boolean;
  selectedCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function BatchDeleteDialog({
  isOpen,
  selectedCount,
  onConfirm,
  onCancel,
}: BatchDeleteDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === "DELETE";

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
      setConfirmText("");
    }
  };

  const handleCancel = () => {
    onCancel();
    setConfirmText("");
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Font Import */}
      <link
        href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Backdrop */}
      <button
        type="button"
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleCancel}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950 border-4 border-amber-500 dark:border-amber-600 rounded-lg shadow-2xl max-w-md w-full animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 p-4 flex items-center justify-between rounded-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded">
                <AlertTriangle
                  className="w-6 h-6 text-white animate-pulse"
                  strokeWidth={3}
                />
              </div>
              <h2
                className="text-xl font-bold text-white tracking-tight"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                AUTHORIZATION REQUIRED
              </h2>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Warning Message */}
            <div className="bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-400 dark:border-amber-700 rounded p-4">
              <p
                className="text-amber-900 dark:text-amber-200 font-semibold text-center"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                YOU ARE ABOUT TO DELETE
              </p>
              <p
                className="text-4xl font-bold text-amber-700 dark:text-amber-400 text-center my-2"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                {selectedCount}
              </p>
              <p
                className="text-amber-900 dark:text-amber-200 font-semibold text-center"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                DOCUMENT{selectedCount > 1 ? "S" : ""}
              </p>
            </div>

            {/* Confirmation Instructions */}
            <div className="space-y-2">
              <p
                className="text-sm text-slate-700 dark:text-slate-300 font-mono"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                This action cannot be undone. Type{" "}
                <span className="font-bold text-amber-700 dark:text-amber-400">
                  DELETE
                </span>{" "}
                to confirm:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-amber-400 dark:border-amber-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-center text-lg font-bold rounded focus:outline-none focus:border-amber-600 dark:focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all uppercase"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded transition-all border-2 border-slate-300 dark:border-slate-600"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                ABORT MISSION
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isConfirmed}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed border-2 border-amber-700 dark:border-amber-500"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                CONFIRM DELETE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 200ms ease-out;
        }

        .animate-slide-up {
          animation: slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </>
  );
}
