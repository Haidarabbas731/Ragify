import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useInfiniteConversations } from "@/hooks/useConversations";
import { conversationLabel } from "@/lib/conversations";
import { formatRelative } from "@/lib/format";

const SHOWN = 3;

/**
 * The latest chats, for small screens only. From the `lg` breakpoint the sidebar already
 * lists them, so showing them here too would repeat it.
 */
export function MobileRecentChats() {
  const { data } = useInfiniteConversations();
  const chats = (data?.pages.flat() ?? []).slice(0, SHOWN);
  if (chats.length === 0) return null;

  return (
    <Card className="lg:hidden">
      <CardHeader className="pb-2">
        <CardTitle>Recent chats</CardTitle>
      </CardHeader>
      <ul className="px-2 pb-2">
        {chats.map((chat) => (
          <li key={chat.conversation_id}>
            <Link
              to={`/chat/${chat.conversation_id}`}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ease-snap active:bg-accent"
            >
              <MessageSquare
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1 truncate text-body">
                {conversationLabel(chat)}
              </span>
              <span className="shrink-0 text-meta text-muted-foreground">
                {formatRelative(chat.updated_at)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}
