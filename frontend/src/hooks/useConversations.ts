import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteConversation,
  getConversation,
  getConversations,
} from "@/lib/api";
import type { Conversation, ConversationListItem } from "@/types/api";

/**
 * Hook to fetch list of conversations
 * @param params - Pagination parameters
 * @returns React Query result with conversations list
 */
export const useConversations = (params?: {
  limit?: number;
  offset?: number;
}) => {
  return useQuery<ConversationListItem[]>({
    queryKey: ["conversations", params],
    queryFn: () => getConversations(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Hook to fetch single conversation with full message history
 * @param conversationId - Conversation ID
 * @returns React Query result with conversation details
 */
export const useConversation = (conversationId: string | undefined) => {
  return useQuery<Conversation>({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId as string),
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Hook to delete a conversation
 * @returns Mutation function and state for deleting conversations
 */
export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("Conversation deleted successfully");
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data
          ?.message || "Failed to delete conversation";
      toast.error(message);
    },
  });
};
