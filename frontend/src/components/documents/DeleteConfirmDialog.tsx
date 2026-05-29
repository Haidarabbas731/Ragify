import { Trash2, X } from "lucide-react";
import { useEffect } from "react";

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
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss is supplementary to the Cancel button */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss is supplementary to the Cancel button */}
      <div
        className="fixed inset-0 z-50 bg-[#222660]/20 backdrop-blur-[2px]"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only, not interactive */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation only, not interactive */}
        <div
          className="w-full max-w-sm rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: "0 24px 64px -12px rgba(34,38,96,0.20)" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[rgba(204,79,14,0.10)] flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-[#cc4f0e]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#222660]">
                  Delete document?
                </h2>
                <p className="text-[12px] text-[#717187] mt-0.5">
                  This action cannot be undone
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#717187] hover:bg-[rgba(0,51,255,0.05)] hover:text-[#222660] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File name */}
          <div className="px-6 pb-5">
            <div className="px-3 py-2.5 rounded-xl bg-[rgba(0,51,255,0.04)] border border-[rgba(34,38,96,0.08)]">
              <p className="text-[13px] font-medium text-[#222660] break-all">
                {filename}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border border-[rgba(34,38,96,0.12)] text-[13px] font-semibold text-[#717187] hover:text-[#222660] hover:bg-[rgba(0,51,255,0.04)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 h-10 rounded-xl bg-[#cc4f0e] hover:bg-[#b34409] text-white text-[13px] font-semibold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
