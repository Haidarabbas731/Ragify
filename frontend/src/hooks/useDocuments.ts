import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  batchDeleteDocuments,
  bulkUploadDocuments,
  deleteAllDocuments,
  deleteDocument,
  getDocument,
  getDocuments,
  retryAllFailedDocuments,
  retryDocument,
  updateDocument,
  uploadDocument,
} from "@/lib/api";
import type {
  BatchDeleteRequest,
  BulkUploadResponse,
  Document,
  DocumentListParams,
  DocumentListResponse,
  DocumentUpdateRequest,
  RetryAllResponse,
} from "@/types/api";

/**
 * Hook to fetch paginated list of documents with filters
 * @param params - Query parameters (pagination, filters, sorting)
 * @returns React Query result with documents list
 */
export const useDocuments = (params?: DocumentListParams) => {
  return useQuery<DocumentListResponse>({
    queryKey: ["documents", params],
    queryFn: () => getDocuments(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch single document by ID
 * @param documentId - Document ID
 * @returns React Query result with document details
 */
export const useDocument = (documentId: string | undefined) => {
  return useQuery<Document>({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId as string),
    enabled: !!documentId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to upload a document
 * @returns Mutation function and state for uploading documents
 */
export const useUploadDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      file,
      collectionId,
    }: {
      file: File;
      collectionId?: string;
    }) => uploadDocument(file, collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      toast.success("Document uploaded successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to upload document";
      toast.error(message);
    },
  });
};

/**
 * Hook to update document metadata
 * @returns Mutation function and state for updating documents
 */
export const useUpdateDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      updates,
    }: {
      documentId: string;
      updates: DocumentUpdateRequest;
    }) => updateDocument(documentId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({
        queryKey: ["document", variables.documentId],
      });
      toast.success("Document updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to update document";
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a single document
 * @returns Mutation function and state for deleting documents
 */
export const useDeleteDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      toast.success("Document deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to delete document";
      toast.error(message);
    },
  });
};

/**
 * Hook to batch delete multiple documents
 * @returns Mutation function and state for batch deletion
 */
export const useBatchDeleteDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BatchDeleteRequest) =>
      batchDeleteDocuments(request.document_ids),
    onSuccess: (data: { deleted_count: number }) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      toast.success(`${data.deleted_count} document(s) deleted successfully`);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to delete documents";
      toast.error(message);
    },
  });
};

/**
 * Hook to delete all user documents
 * @returns Mutation function and state for deleting all documents
 */
export const useDeleteAllDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAllDocuments,
    onSuccess: (data: { deleted_count: number }) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      toast.success(`${data.deleted_count} document(s) deleted successfully`);
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to delete all documents";
      toast.error(message);
    },
  });
};

/**
 * Hook to retry processing a failed document
 * @returns Mutation function and state for retrying document processing
 */
export const useRetryDocument = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => retryDocument(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", documentId] });
      toast.success("Document processing queued");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to retry document";
      toast.error(message);
    },
  });
};

/**
 * Hook to bulk upload multiple documents
 * @returns Mutation function and state for bulk uploading documents
 */
export const useBulkUploadDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation<
    BulkUploadResponse,
    { response?: { data?: { message?: string } } },
    {
      files: File[];
      collectionId?: string;
      category?: string;
      tags?: string;
    }
  >({
    mutationFn: ({ files, collectionId, category, tags }) =>
      bulkUploadDocuments(
        files,
        collectionId,
        category,
        tags,
      ) as Promise<BulkUploadResponse>,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["userStats"] });

      if (data.failed_count > 0) {
        toast.warning(
          `${data.uploaded_count} uploaded, ${data.failed_count} failed`,
        );
      } else {
        toast.success(
          `${data.uploaded_count} document(s) uploaded successfully`,
        );
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to upload documents";
      toast.error(message);
    },
  });
};

/**
 * Hook to retry all failed documents
 * @returns Mutation function and state for retrying all failed documents
 */
export const useRetryAllFailedDocuments = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RetryAllResponse,
    { response?: { data?: { message?: string } } }
  >({
    mutationFn: retryAllFailedDocuments as () => Promise<RetryAllResponse>,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      if (data.failed_count > 0) {
        toast.warning(
          `${data.retried_count} retried, ${data.failed_count} failed`,
        );
      } else {
        toast.success(`${data.retried_count} document(s) queued for retry`);
      }
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to retry documents";
      toast.error(message);
    },
  });
};
