import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteConversation,
  getConversation,
  getConversations,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/errors";
import type { Conversation, ConversationListItem } from "@/types/api";

export const CONVERSATIONS_PAGE_SIZE = 20;

const infiniteKey = (pageSize: number) => [
  "conversations",
  "infinite",
  pageSize,
];

/**
 * Hook to page through conversations for the sidebar history.
 * The API has no total, so a short page means there is nothing more to load.
 * @param pageSize - Conversations per request
 */
export const useInfiniteConversations = (
  pageSize = CONVERSATIONS_PAGE_SIZE,
) => {
  return useInfiniteQuery({
    queryKey: infiniteKey(pageSize),
    queryFn: ({ pageParam }) =>
      getConversations({ limit: pageSize, offset: pageParam }) as Promise<
        ConversationListItem[]
      >,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < pageSize ? undefined : allPages.length * pageSize,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Puts a just-created conversation at the top of the sidebar history so it appears
 * before the next refetch confirms it.
 */
export const useAddConversationToHistory = () => {
  const queryClient = useQueryClient();
  return (conversation: ConversationListItem) => {
    queryClient.setQueryData<InfiniteData<ConversationListItem[], number>>(
      infiniteKey(CONVERSATIONS_PAGE_SIZE),
      (data) => {
        if (!data) return data;
        const exists = data.pages.some((page) =>
          page.some((c) => c.conversation_id === conversation.conversation_id),
        );
        if (exists) return data;
        const [first = [], ...rest] = data.pages;
        return { ...data, pages: [[conversation, ...first], ...rest] };
      },
    );
  };
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
      const message = getApiErrorMessage(
        error,
        "Failed to delete conversation",
      );
      toast.error(message);
    },
  });
};
