import { MoreHorizontal, Trash2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { conversationLabel } from "@/lib/conversations";
import { cn } from "@/lib/utils";
import type { ConversationListItem } from "@/types/api";

interface ConversationRowProps {
  conversation: ConversationListItem;
  active: boolean;
  /** True while the row is animating out after a delete. */
  collapsing: boolean;
  onNavigate?: () => void;
  onDelete: (conversation: ConversationListItem) => void;
}

/** One chat in the sidebar history: a link with a hover/focus menu for delete. */
export function ConversationRow({
  conversation,
  active,
  collapsing,
  onNavigate,
  onDelete,
}: ConversationRowProps) {
  const label = conversationLabel(conversation);

  return (
    <li
      className="collapse-rows"
      data-collapsed={collapsing}
      aria-hidden={collapsing || undefined}
    >
      <div className={cn(conversation.client_added && "motion-row-in")}>
        <div className="group relative">
          <NavLink
            to={`/chat/${conversation.conversation_id}`}
            onClick={onNavigate}
            title={label}
            className={cn(
              "block truncate rounded-lg py-1.5 pl-3 pr-9 text-body transition-colors duration-150 ease-snap",
              active
                ? "bg-secondary font-medium text-secondary-foreground"
                : "text-foreground hover:bg-accent",
            )}
          >
            {label}
          </NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={`Actions for ${label}`}
              className={cn(
                "absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-[opacity,background-color] duration-150 ease-snap hover:bg-background group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[state=open]:opacity-100 [@media(hover:none)]:opacity-100",
                active && "opacity-100",
              )}
            >
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => onDelete(conversation)}
              >
                <Trash2 /> Delete chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}
