/**
 * Delete All Documents Confirmation Dialog - Critical Mission Authorization
 * Double-confirmation for destructive "delete all my documents" operation
 * Fonts: Rajdhani (display), JetBrains Mono (monospace)
 */

import { AlertTriangle, Skull, X } from "lucide-react";
import { useState } from "react";

interface DeleteAllDialogProps {
  isOpen: boolean;
  totalCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteAllDialog({
  isOpen,
  totalCount,
  onConfirm,
  onCancel,
}: DeleteAllDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmed = confirmText === "DELETE ALL";

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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
        onClick={handleCancel}
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-900 dark:to-red-950 border-4 border-red-600 dark:border-red-700 rounded-lg shadow-2xl max-w-md w-full animate-slide-up">
          {/* Critical Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 flex items-center justify-between rounded-t">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded animate-pulse-slow">
                <Skull className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <div>
                <h2
                  className="text-xl font-bold text-white tracking-tight"
                  style={{ fontFamily: "Rajdhani, sans-serif" }}
                >
                  ⚠️ CRITICAL WARNING ⚠️
                </h2>
                <p
                  className="text-xs text-red-100 font-mono"
                  style={{ fontFamily: "JetBrains Mono, monospace" }}
                >
                  IRREVERSIBLE ACTION
                </p>
              </div>
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
            {/* Critical Warning Box */}
            <div className="bg-red-100 dark:bg-red-900/30 border-4 border-red-500 dark:border-red-700 rounded p-4 animate-pulse-border">
              <div className="flex items-center gap-3 mb-2">
                <AlertTriangle
                  className="w-6 h-6 text-red-700 dark:text-red-400 animate-pulse"
                  strokeWidth={3}
                />
                <p
                  className="text-red-900 dark:text-red-200 font-bold text-lg"
                  style={{ fontFamily: "Rajdhani, sans-serif" }}
                >
                  TOTAL DESTRUCTION IMMINENT
                </p>
              </div>
              <p
                className="text-red-800 dark:text-red-300 font-semibold"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                YOU ARE ABOUT TO PERMANENTLY DELETE:
              </p>
              <p
                className="text-5xl font-bold text-red-700 dark:text-red-400 text-center my-3"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                ALL {totalCount}
              </p>
              <p
                className="text-red-800 dark:text-red-300 font-semibold text-center"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                OF YOUR DOCUMENTS
              </p>
            </div>

            {/* Consequences List */}
            <div className="bg-white dark:bg-slate-800 border-2 border-red-300 dark:border-red-800 rounded p-3 space-y-1">
              <p
                className="text-xs font-bold text-red-700 dark:text-red-400 mb-2"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                CONSEQUENCES:
              </p>
              <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    ×
                  </span>
                  <span>All documents will be permanently deleted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    ×
                  </span>
                  <span>
                    All document chunks will be removed from vector DB
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    ×
                  </span>
                  <span>Chat history will reference non-existent sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 dark:text-red-400 font-bold">
                    ×
                  </span>
                  <span className="font-bold text-red-700 dark:text-red-400">
                    THIS ACTION CANNOT BE UNDONE
                  </span>
                </li>
              </ul>
            </div>

            {/* Double Confirmation */}
            <div className="space-y-2">
              <p
                className="text-sm text-slate-700 dark:text-slate-300 font-mono"
                style={{ fontFamily: "JetBrains Mono, monospace" }}
              >
                Type{" "}
                <span className="font-bold text-red-700 dark:text-red-400">
                  DELETE ALL
                </span>{" "}
                to authorize this critical operation:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE ALL"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-3 border-red-500 dark:border-red-600 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 font-mono text-center text-lg font-bold rounded focus:outline-none focus:border-red-700 dark:focus:border-red-500 focus:ring-4 focus:ring-red-500/20 transition-all uppercase"
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
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!isConfirmed}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-slate-400 disabled:to-slate-500 text-white font-bold rounded transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed border-2 border-red-800 dark:border-red-600"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                EXECUTE DELETION
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

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.6;
          }
        }

        @keyframes pulse-border {
          0%, 100% {
            border-color: rgb(239 68 68);
          }
          50% {
            border-color: rgb(220 38 38);
          }
        }

        .animate-fade-in {
          animation: fade-in 200ms ease-out;
        }

        .animate-slide-up {
          animation: slide-up 300ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }

        .animate-pulse-border {
          animation: pulse-border 2s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
