import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createCollection,
  deleteCollection,
  getCollection,
  getCollections,
  updateCollection,
} from "@/lib/api";
import type {
  Collection,
  CreateCollectionRequest,
  UpdateCollectionRequest,
} from "@/types/api";

/**
 * Hook to fetch list of collections
 * @returns React Query result with collections list
 */
export const useCollections = () => {
  return useQuery<Collection[]>({
    queryKey: ["collections"],
    queryFn: () => getCollections(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to fetch single collection with details
 * @param collectionId - Collection ID
 * @returns React Query result with collection details
 */
export const useCollection = (collectionId: string | undefined) => {
  return useQuery<Collection>({
    queryKey: ["collection", collectionId],
    queryFn: () => getCollection(collectionId as string),
    enabled: !!collectionId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to create a new collection
 * @returns Mutation function and state for creating collections
 */
export const useCreateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionData: CreateCollectionRequest) =>
      createCollection(collectionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to create collection";
      toast.error(message);
    },
  });
};

/**
 * Hook to update collection metadata
 * @returns Mutation function and state for updating collections
 */
export const useUpdateCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      collectionId,
      updates,
    }: {
      collectionId: string;
      updates: UpdateCollectionRequest;
    }) => updateCollection(collectionId, updates),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({
        queryKey: ["collection", variables.collectionId],
      });
      toast.success("Collection updated successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to update collection";
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a collection
 * @returns Mutation function and state for deleting collections
 */
export const useDeleteCollection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (collectionId: string) => deleteCollection(collectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to delete collection";
      toast.error(message);
    },
  });
};
