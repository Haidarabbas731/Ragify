/**
 * Document Upload Zone - Data Intake Terminal
 * Industrial-futuristic upload interface with drag-drop, validation, and progress tracking
 * Fonts: Fira Code (technical readouts), Space Grotesk (headings), Inter (body)
 */

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Button } from "../ui/button";

interface UploadedFile {
  file: File;
  id: string;
  status: "pending" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
  chunks?: number;
}

interface UploadZoneProps {
  onUploadComplete?: () => void;
}

const ALLOWED_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "text/plain": [".txt"],
  "text/markdown": [".md"],
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function UploadZone({ onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string>("");

  const onDrop = (
    acceptedFiles: File[],
    rejectedFiles: {
      file: File;
      errors: { code: string; message: string }[];
    }[],
  ) => {
    // Handle rejected files
    rejectedFiles.forEach((rejection) => {
      const errors = rejection.errors
        .map((e) => {
          if (e.code === "file-too-large") return "File exceeds 50MB limit";
          if (e.code === "file-invalid-type")
            return "Invalid file type (PDF, DOCX, TXT, MD only)";
          return e.message;
        })
        .join(", ");
      toast.error(`${rejection.file.name}: ${errors}`);
    });

    // Add accepted files to queue
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      file,
      id: Math.random().toString(36).substring(7),
      status: "pending",
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ALLOWED_TYPES,
    maxSize: MAX_FILE_SIZE,
    multiple: true,
  });

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter((f) => f.status === "pending");

    if (pendingFiles.length === 0) {
      toast.error("No files to upload");
      return;
    }

    for (const fileItem of pendingFiles) {
      try {
        // Update status to uploading
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "uploading", progress: 0 }
              : f,
          ),
        );

        // Create FormData
        const formData = new FormData();
        formData.append("file", fileItem.file);
        if (selectedCollection) {
          formData.append("collection_id", selectedCollection);
        }

        // Simulate upload with progress (replace with actual API call)
        await simulateUpload(fileItem.id, (progress) => {
          setFiles((prev) =>
            prev.map((f) => (f.id === fileItem.id ? { ...f, progress } : f)),
          );
        });

        // Success
        const mockChunks = Math.floor(Math.random() * 50) + 10; // Mock chunk count
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? { ...f, status: "success", progress: 100, chunks: mockChunks }
              : f,
          ),
        );

        toast.success(
          `${fileItem.file.name} uploaded successfully (${mockChunks} chunks)`,
        );
      } catch (error) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  status: "error",
                  error:
                    error instanceof Error ? error.message : "Upload failed",
                }
              : f,
          ),
        );
        toast.error(`Failed to upload ${fileItem.file.name}`);
      }
    }

    onUploadComplete?.();
  };

  // Mock upload simulation (replace with actual API call)
  const simulateUpload = (
    _id: string,
    onProgress: (progress: number) => void,
  ): Promise<void> => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          onProgress(100);
          setTimeout(resolve, 200);
        } else {
          onProgress(progress);
        }
      }, 300);
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return "text-slate-500 dark:text-slate-400";
      case "uploading":
        return "text-blue-600 dark:text-blue-400";
      case "success":
        return "text-emerald-600 dark:text-emerald-400";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  const getStatusIcon = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return <FileText className="w-5 h-5" />;
      case "uploading":
        return <Loader2 className="w-5 h-5 animate-spin" />;
      case "success":
        return <CheckCircle2 className="w-5 h-5" />;
      case "error":
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer ${
          isDragActive
            ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950/30 scale-[1.02]"
            : "border-slate-300 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 hover:border-blue-400 dark:hover:border-blue-600"
        }`}
      >
        <input {...getInputProps()} />

        {/* Scan line animation */}
        {isDragActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />
          </div>
        )}

        <div className="p-12 text-center">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
              isDragActive
                ? "bg-blue-100 dark:bg-blue-900 scale-110"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            <Upload
              className={`w-10 h-10 transition-colors ${
                isDragActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            />
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-['Space_Grotesk']">
            {isDragActive ? "Drop files here" : "Upload Documents"}
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 font-['Inter']">
            Drag & drop files here or click to browse
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-500 font-['Fira_Code']">
            PDF, DOCX, TXT, MD • Max 50MB per file
          </p>
        </div>
      </div>

      {/* Collection Selector */}
      {files.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <label
            htmlFor="collection"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 font-['Inter']"
          >
            Collection (Optional)
          </label>
          <select
            id="collection"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-['Inter'] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
          >
            <option value="">All Documents</option>
            <option value="collection-1">Work Documents</option>
            <option value="collection-2">Personal Notes</option>
            <option value="collection-3">Research Papers</option>
          </select>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-['Space_Grotesk']">
              Files ({files.length})
            </h4>
            <Button
              onClick={uploadFiles}
              disabled={files.every((f) => f.status !== "pending")}
              className="gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 font-['Inter'] font-medium"
            >
              <Upload className="w-4 h-4" />
              Upload All
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className={getStatusColor(fileItem.status)}>
                    {getStatusIcon(fileItem.status)}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate font-['Inter']">
                        {fileItem.file.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFile(fileItem.id)}
                        disabled={fileItem.status === "uploading"}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-['Fira_Code']">
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatFileSize(fileItem.file.size)}
                      </span>
                      {fileItem.status === "success" && fileItem.chunks && (
                        <>
                          <span className="text-slate-400 dark:text-slate-600">
                            •
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {fileItem.chunks} chunks
                          </span>
                        </>
                      )}
                      {fileItem.error && (
                        <>
                          <span className="text-slate-400 dark:text-slate-600">
                            •
                          </span>
                          <span className="text-red-600 dark:text-red-400">
                            {fileItem.error}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {fileItem.status === "uploading" && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"
                            style={{ width: `${fileItem.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-['Fira_Code']">
                          {Math.round(fileItem.progress)}%
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% {
            top: 0%;
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }

        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
