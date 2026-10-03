import {
  differenceInCalendarDays,
  format,
  isToday,
  isYesterday,
} from "date-fns";
import type { ConversationListItem } from "@/types/api";

/** Text shown for a conversation in lists. The API's `last_message` is the first user message. */
export function conversationLabel(
  conversation: Pick<ConversationListItem, "last_message">,
): string {
  const text = conversation.last_message?.replace(/\s+/g, " ").trim();
  return text || "New chat";
}

export interface ConversationGroup {
  label: string;
  items: ConversationListItem[];
}

/** Bucket name for a date: Today, Yesterday, Previous 7 days, Previous 30 days, then the month. */
function groupLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  const days = differenceInCalendarDays(new Date(), date);
  if (days <= 7) return "Previous 7 days";
  if (days <= 30) return "Previous 30 days";
  return format(date, "MMMM yyyy");
}

/**
 * Groups conversations by when they were last updated, keeping the incoming order.
 * Expects the list newest-first, which is how the API returns it.
 */
export function groupConversations(
  conversations: ConversationListItem[],
): ConversationGroup[] {
  const groups: ConversationGroup[] = [];
  for (const conversation of conversations) {
    const label = groupLabel(new Date(conversation.updated_at));
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(conversation);
    else groups.push({ label, items: [conversation] });
  }
  return groups;
}
