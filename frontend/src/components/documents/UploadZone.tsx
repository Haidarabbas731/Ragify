/**
 * Document Upload Zone - Data Intake Terminal
 * Clean upload interface with drag-drop, validation, and progress tracking
 * Fonts: Geist (UI), Geist Mono (technical readouts)
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
import { useBulkUploadDocuments } from "../../hooks/useDocuments";
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

  // Use the real bulk upload mutation
  const bulkUploadMutation = useBulkUploadDocuments();

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

    // Set all pending files to uploading status
    setFiles((prev) =>
      prev.map((f) =>
        f.status === "pending" ? { ...f, status: "uploading", progress: 0 } : f,
      ),
    );

    try {
      // Call the real API with bulk upload
      const filesToUpload = pendingFiles.map((f) => f.file);
      const result = await bulkUploadMutation.mutateAsync({
        files: filesToUpload,
        collectionId: selectedCollection || undefined,
      });

      // Update successful uploads
      setFiles((prev) =>
        prev.map((f) => {
          const uploaded = result.documents?.find(
            (doc) => doc.filename === f.file.name,
          );
          if (uploaded) {
            return {
              ...f,
              status: "success",
              progress: 100,
              chunks: uploaded.chunk_count || 0,
            };
          }
          // Check if file failed
          const failed = result.failed_uploads?.find(
            (fail) => fail.filename === f.file.name,
          );
          if (failed) {
            return {
              ...f,
              status: "error",
              error: failed.error,
            };
          }
          return f;
        }),
      );

      onUploadComplete?.();
    } catch (error) {
      // Mark all uploading files as error
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "uploading"
            ? {
                ...f,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : f,
        ),
      );
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: UploadedFile["status"]) => {
    switch (status) {
      case "pending":
        return "text-muted-foreground";
      case "uploading":
        return "text-primary";
      case "success":
        return "text-emerald-600 dark:text-emerald-400";
      case "error":
        return "text-destructive";
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
            ? "border-primary bg-primary/10 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />

        {/* Scan line animation */}
        {isDragActive && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-scan" />
          </div>
        )}

        <div className="p-12 text-center">
          <div
            className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300 ${
              isDragActive ? "bg-primary/20 scale-110" : "bg-muted"
            }`}
          >
            <Upload
              className={`w-10 h-10 transition-colors ${
                isDragActive ? "text-primary" : "text-muted-foreground"
              }`}
            />
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2 font-sans">
            {isDragActive ? "Drop files here" : "Upload Documents"}
          </h3>

          <p className="text-sm text-muted-foreground mb-1 font-sans">
            Drag & drop files here or click to browse
          </p>

          <p className="text-xs text-muted-foreground font-mono">
            PDF, DOCX, TXT, MD • Max 50MB per file
          </p>
        </div>
      </div>

      {/* Collection Selector */}
      {files.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <label
            htmlFor="collection"
            className="block text-sm font-medium text-foreground mb-2 font-sans"
          >
            Collection (Optional)
          </label>
          <select
            id="collection"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground font-sans focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Documents</option>
            {/* TODO: Replace with real collections from API */}
            {/* <option value="collection-1">Work Documents</option>
            <option value="collection-2">Personal Notes</option>
            <option value="collection-3">Research Papers</option> */}
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

                    {/* Progress Bar - Indeterminate loading */}
                    {fileItem.status === "uploading" && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 animate-pulse w-full" />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-['Fira_Code']">
                          Uploading...
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
