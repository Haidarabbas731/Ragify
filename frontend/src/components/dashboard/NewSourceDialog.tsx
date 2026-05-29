import { FileText, Globe, Info, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { useUploadDocument } from "../../hooks/useDocuments";

interface NewSourceDialogProps {
  open: boolean;
  onClose: () => void;
  onUploadComplete?: () => void;
}

type Tab = "file" | "url";

export function NewSourceDialog({
  open,
  onClose,
  onUploadComplete,
}: NewSourceDialogProps) {
  const [tab, setTab] = useState<Tab>("file");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [showTooltip, setShowTooltip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadDocument();

  if (!open) return null;

  const handleFile = (file: File) => {
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleSubmit = async () => {
    if (tab === "file" && selectedFile) {
      await uploadMutation.mutateAsync({ file: selectedFile });
      onUploadComplete?.();
      onClose();
      setSelectedFile(null);
    }
    if (tab === "url" && url.trim()) {
      // URL ingestion — backend support coming soon
      onClose();
      setUrl("");
    }
  };

  const canSubmit = tab === "file" ? !!selectedFile : !!url.trim();

  return (
    <>
      {/* Backdrop */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: backdrop dismiss is supplementary to explicit close button */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss is supplementary to explicit close button */}
      <div
        className="fixed inset-0 z-50 bg-[#222660]/20 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: stopPropagation only, not interactive */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: stopPropagation only, not interactive */}
        <div
          className="w-full max-w-md rounded-2xl bg-white shadow-[0_24px_64px_-12px_rgba(34,38,96,0.20)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4">
            <div>
              <h2 className="text-[17px] font-bold text-[#222660]">
                Add New Source
              </h2>
              <p className="text-[12px] text-[#717187] mt-0.5">
                Upload a file or connect a URL to your knowledge base
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#717187] hover:bg-[rgba(0,51,255,0.06)] hover:text-[#222660] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6">
            <div className="flex gap-1 p-1 rounded-xl bg-[rgba(0,51,255,0.04)] w-fit">
              {(
                [
                  { id: "file", label: "Upload File", icon: Upload },
                  { id: "url", label: "From URL", icon: Globe },
                ] as { id: Tab; label: string; icon: typeof Upload }[]
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                    tab === id
                      ? "bg-white text-[#222660] shadow-[0_1px_4px_rgba(34,38,96,0.10)]"
                      : "text-[#717187] hover:text-[#222660]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5">
            {tab === "file" && (
              <div>
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: file drop zone, keyboard access via the hidden input */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: file drop zone, keyboard access via the hidden input */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-150 py-10 ${
                    dragging
                      ? "border-[#7733ea] bg-[rgba(119,51,234,0.04)]"
                      : selectedFile
                        ? "border-[#7733ea]/40 bg-[rgba(119,51,234,0.03)]"
                        : "border-[rgba(34,38,96,0.12)] hover:border-[#7733ea]/50 hover:bg-[rgba(0,51,255,0.03)]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFile(f);
                    }}
                  />
                  {selectedFile ? (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[rgba(119,51,234,0.10)] flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[#7733ea]" />
                      </div>
                      <div className="text-center">
                        <p className="text-[14px] font-semibold text-[#222660]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[12px] text-[#717187] mt-0.5">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        className="text-[12px] text-[#717187] hover:text-[#222660] underline"
                      >
                        Change file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-[rgba(0,51,255,0.06)] flex items-center justify-center">
                        <Upload className="w-5 h-5 text-[#717187]" />
                      </div>
                      <div className="text-center">
                        <p className="text-[14px] font-semibold text-[#222660]">
                          Drop your file here
                        </p>
                        <p className="text-[12px] text-[#717187] mt-0.5">
                          or{" "}
                          <span className="text-[#7733ea] font-semibold">
                            browse
                          </span>{" "}
                          to upload
                        </p>
                      </div>
                      <p className="text-[11px] text-[#717187]">
                        PDF, DOCX, TXT, MD · Max 50MB
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {tab === "url" && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <label
                      htmlFor="source-url"
                      className="text-[13px] font-semibold text-[#222660]"
                    >
                      Document URL
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className="text-[#717187] hover:text-[#222660] transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                      {showTooltip && (
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 p-3 rounded-xl bg-[#222660] text-white text-[11px] leading-relaxed shadow-xl z-10">
                          The URL must be <strong>publicly accessible</strong>.
                          Private, authenticated, or login-protected URLs won't
                          work.
                          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#222660]" />
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    id="source-url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/document.pdf"
                    className="w-full h-10 px-3 rounded-xl border border-[rgba(34,38,96,0.12)] bg-[rgba(0,51,255,0.03)] text-[13px] text-[#222660] placeholder:text-[#717187] focus:outline-none focus:border-[#7733ea] focus:bg-white transition-all"
                  />
                </div>

                {/* Coming soon notice */}
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(0,51,255,0.04)] border border-[rgba(0,51,255,0.08)]">
                  <Info className="w-3.5 h-3.5 text-[#153bf5] mt-0.5 shrink-0" />
                  <p className="text-[12px] text-[#717187] leading-relaxed">
                    URL ingestion is coming soon. We'll fetch and index the
                    document at this URL automatically.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-[rgba(34,38,96,0.12)] text-[13px] font-semibold text-[#717187] hover:text-[#222660] hover:bg-[rgba(0,51,255,0.04)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || uploadMutation.isPending}
              className="flex-1 h-10 rounded-xl text-white text-[13px] font-semibold transition-opacity disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #7733ea 0%, #153bf5 100%)",
              }}
            >
              {uploadMutation.isPending
                ? "Uploading…"
                : tab === "url"
                  ? "Add URL"
                  : "Upload File"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
