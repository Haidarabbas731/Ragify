/**
 * Delete Confirmation Dialog - Terminal Warning System
 * Critical operation confirmation with distinctive retro-terminal aesthetic
 * Fonts: JetBrains Mono (monospace), IBM Plex Sans (UI), Courier New (fallback)
 */

import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  filename: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  isOpen,
  filename,
  onConfirm,
  onCancel,
}: DeleteConfirmDialogProps) {
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [scanlinePosition, setScanlinePosition] = useState(0);

  // Scanline animation
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setScanlinePosition((prev) => (prev >= 100 ? 0 : prev + 2));
    }, 50);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setConfirmText("");
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  const handleCancel = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      onCancel();
      setIsAnimatingOut(false);
    }, 200);
  }, [onCancel]);

  const handleConfirm = useCallback(() => {
    if (confirmText.toUpperCase() === "DELETE") {
      setIsAnimatingOut(true);
      setTimeout(() => {
        onConfirm();
        setIsAnimatingOut(false);
      }, 200);
    }
  }, [confirmText, onConfirm]);

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

  const isDeleteEnabled = confirmText.toUpperCase() === "DELETE";

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
        className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-default"
        aria-label="Close dialog"
      />

      {/* Dialog */}
      <div
        className={`relative w-full max-w-md bg-slate-950 border-2 border-red-600/50 rounded-none shadow-2xl shadow-red-900/50 overflow-hidden ${
          isAnimatingOut ? "animate-scaleOut" : "animate-scaleIn"
        }`}
        style={{
          boxShadow:
            "0 0 60px rgba(220, 38, 38, 0.3), 0 0 120px rgba(220, 38, 38, 0.1), inset 0 0 60px rgba(220, 38, 38, 0.05)",
        }}
      >
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-red-500/30 to-transparent"
            style={{
              top: `${scanlinePosition}%`,
              filter: "blur(1px)",
            }}
          />
        </div>

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
          }}
        />

        {/* Close button */}
        <button
          type="button"
          onClick={handleCancel}
          className="absolute top-3 right-3 p-1.5 rounded hover:bg-red-950/50 transition-colors z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-red-400" />
        </button>

        {/* Header */}
        <div className="relative border-b border-red-800/50 bg-gradient-to-b from-red-950/50 to-transparent px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-900/30 border border-red-700/50 rounded-sm">
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-red-400 uppercase tracking-widest font-['IBM_Plex_Sans',sans-serif] mb-0.5">
                ⚠ Critical Operation
              </h2>
              <p className="text-xs text-red-500/70 font-mono">
                Authorization Required
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="relative px-6 py-6 space-y-5">
          {/* Warning message */}
          <div className="space-y-3">
            <div className="bg-red-950/30 border border-red-800/30 rounded-sm p-4">
              <p className="text-red-200 text-sm font-medium font-['IBM_Plex_Sans',sans-serif] mb-2">
                You are about to permanently delete:
              </p>
              <p className="text-red-100 text-base font-mono break-all bg-black/40 px-3 py-2 rounded-sm border border-red-700/30">
                {filename}
              </p>
            </div>

            <div className="space-y-2 text-xs font-mono text-red-400/70">
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold">&gt;</span>
                <span>This action cannot be reversed</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold">&gt;</span>
                <span>
                  All document chunks will be removed from vector database
                </span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-red-500 font-bold">&gt;</span>
                <span>Storage quota will be freed immediately</span>
              </p>
            </div>
          </div>

          {/* Confirmation input */}
          <div className="space-y-2">
            <label
              htmlFor="delete-confirm"
              className="block text-xs font-semibold text-red-300 uppercase tracking-wider font-['IBM_Plex_Sans',sans-serif]"
            >
              Type <span className="text-red-400 font-mono">DELETE</span> to
              confirm
            </label>
            <input
              id="delete-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              className="w-full px-4 py-3 bg-black/60 border-2 border-red-800/50 text-red-100 placeholder:text-red-900/50 font-mono text-sm rounded-sm focus:outline-none focus:border-red-600 focus:ring-2 focus:ring-red-600/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter" && isDeleteEnabled) {
                  handleConfirm();
                }
              }}
            />
            {confirmText && !isDeleteEnabled && (
              <p className="text-xs text-red-500/70 font-mono flex items-center gap-1.5">
                <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
                Input mismatch - authorization denied
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative border-t border-red-800/50 bg-gradient-to-t from-red-950/30 to-transparent px-6 py-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-medium text-sm rounded-sm transition-all font-['IBM_Plex_Sans',sans-serif] hover:scale-[1.02] active:scale-[0.98]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isDeleteEnabled}
            className={`flex-1 px-4 py-2.5 font-bold text-sm rounded-sm transition-all font-['IBM_Plex_Sans',sans-serif] uppercase tracking-wide ${
              isDeleteEnabled
                ? "bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white shadow-lg shadow-red-900/50 hover:shadow-xl hover:shadow-red-900/70 hover:scale-[1.02] active:scale-[0.98] border-2 border-red-500"
                : "bg-red-950/20 text-red-900/50 cursor-not-allowed border-2 border-red-900/30"
            }`}
          >
            {isDeleteEnabled ? "⚠ Execute Delete" : "Locked"}
          </button>
        </div>

        {/* Corner decorations */}
        <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-red-600/50" />
        <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-red-600/50" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-red-600/50" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-red-600/50" />
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

        @keyframes scaleOut {
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
