import { Command as CommandPrimitive } from "cmdk";
import {
  FileText,
  FolderOpen,
  HardDrive,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
  Shield,
  SquarePen,
  Sun,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { useCollections } from "@/hooks/useCollections";
import { useInfiniteConversations } from "@/hooks/useConversations";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDocuments } from "@/hooks/useDocuments";
import { conversationLabel } from "@/lib/conversations";
import { useAuthStore } from "@/store/authStore";

/** Most rows one group shows, so the list stays scannable. */
const GROUP_LIMIT = 5;

/** True when every word of the query appears in one of the terms. An empty query matches everything. */
function matches(query: string, ...terms: string[]): boolean {
  const haystack = terms.join(" ").toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

interface CommandMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Opens the New source dialog. */
  onNewSource: () => void;
}

/**
 * Global command menu: jump to a page, start something, or find a chat, document or collection.
 * Opens with Ctrl+K / ⌘K. Filtering is ours (`shouldFilter={false}`) because documents come from the server.
 */
export function CommandMenu({
  open,
  onOpenChange,
  onNewSource,
}: CommandMenuProps) {
  return (
    <CommandPrimitive.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Command menu"
      shouldFilter={false}
      loop
      vimBindings={false}
      overlayClassName="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] motion-palette"
      contentClassName="fixed left-1/2 top-[12dvh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-float outline-none motion-palette"
    >
      <CommandMenuBody
        onClose={() => onOpenChange(false)}
        onNewSource={onNewSource}
      />
    </CommandPrimitive.Dialog>
  );
}

/** Mounted only while the menu is open, so the search resets and no request runs while it is closed. */
function CommandMenuBody({
  onClose,
  onNewSource,
}: {
  onClose: () => void;
  onNewSource: () => void;
}) {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();
  const { user, logout } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const query = search.trim();
  const debouncedQuery = useDebouncedValue(query, 250);

  const { data: history } = useInfiniteConversations();
  const { data: collectionList } = useCollections();
  const { data: documentList, isFetching: documentsFetching } = useDocuments(
    { search: debouncedQuery, limit: GROUP_LIMIT },
    { enabled: debouncedQuery.length > 0 },
  );

  /** Closes the menu first, then runs the action. */
  const run = (action: () => void) => () => {
    onClose();
    action();
  };

  const goTo = [
    {
      value: "go-dashboard",
      label: "Dashboard",
      to: "/dashboard",
      icon: HardDrive,
    },
    {
      value: "go-documents",
      label: "Documents",
      to: "/documents",
      icon: FileText,
    },
    {
      value: "go-collections",
      label: "Collections",
      to: "/collections",
      icon: FolderOpen,
    },
    { value: "go-profile", label: "Profile", to: "/profile", icon: User },
    ...(isAdmin
      ? [{ value: "go-admin", label: "Admin", to: "/admin", icon: Shield }]
      : []),
  ].filter((item) => matches(query, item.label, "go to", "open"));

  const actions = [
    {
      value: "action-new-chat",
      label: "New chat",
      keywords: "ask question conversation",
      icon: SquarePen,
      run: () => navigate("/chat"),
    },
    {
      value: "action-new-source",
      label: "New source",
      keywords: "upload add file document",
      icon: Plus,
      run: onNewSource,
    },
    {
      value: "action-toggle-theme",
      label: darkMode ? "Switch to light theme" : "Switch to dark theme",
      keywords: "theme dark light appearance mode",
      icon: darkMode ? Sun : Moon,
      run: toggleDarkMode,
    },
    {
      value: "action-log-out",
      label: "Log out",
      keywords: "sign out logout",
      icon: LogOut,
      run: () => {
        logout();
        navigate("/login");
      },
    },
  ].filter((item) => matches(query, item.label, item.keywords));

  const chats = (history?.pages.flat() ?? [])
    .filter((chat) => matches(query, conversationLabel(chat)))
    .slice(0, GROUP_LIMIT);

  const collections = query
    ? (collectionList?.collections ?? [])
        .filter((collection) => matches(query, collection.name))
        .slice(0, GROUP_LIMIT)
    : [];

  const documents = query ? (documentList?.documents ?? []) : [];
  const documentsPending =
    query.length > 0 && (query !== debouncedQuery || documentsFetching);

  // Row values in the order the groups render, so the first row is always the selected one.
  const visibleValues = [
    ...goTo.map((item) => item.value),
    ...actions.map((item) => item.value),
    ...chats.map((chat) => `chat-${chat.conversation_id}`),
    ...documents.map((document) => `doc-${document.document_id}`),
    ...collections.map((collection) => `col-${collection.collection_id}`),
  ];
  const hasResults = visibleValues.length > 0;
  const activeValue = visibleValues.includes(selected)
    ? selected
    : (visibleValues[0] ?? "");

  // cmdk only updates the input's aria-activedescendant on arrow keys and leaves it empty or pointing at
  // a row that no longer exists after typing, so keep it on the selected row for screen readers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run whenever the visible rows change
  useEffect(() => {
    const input = inputRef.current;
    const row = [
      ...(input?.closest("[cmdk-root]")?.querySelectorAll("[cmdk-item]") ?? []),
    ].find(
      (el) =>
        el.getAttribute("data-value")?.toLowerCase() ===
        activeValue.toLowerCase(),
    );
    if (row?.id) input?.setAttribute("aria-activedescendant", row.id);
    else input?.removeAttribute("aria-activedescendant");
  }, [activeValue, visibleValues.join("|")]);

  return (
    <Command
      shouldFilter={false}
      loop
      vimBindings={false}
      label="Command menu"
      className="rounded-none"
      value={activeValue}
      onValueChange={setSelected}
    >
      <CommandInput
        ref={inputRef}
        value={search}
        onValueChange={setSearch}
        placeholder="Search pages, chats and documents…"
      />
      <CommandList>
        {goTo.length > 0 && (
          <CommandGroup heading="Go to">
            {goTo.map(({ value, label, to, icon: Icon }) => (
              <CommandItem
                key={value}
                value={value}
                onSelect={run(() => navigate(to))}
              >
                <Icon aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {actions.length > 0 && (
          <CommandGroup heading="Actions">
            {actions.map(({ value, label, icon: Icon, run: action }) => (
              <CommandItem key={value} value={value} onSelect={run(action)}>
                <Icon aria-hidden="true" />
                {label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {chats.length > 0 && (
          <CommandGroup heading="Chats">
            {chats.map((chat) => (
              <CommandItem
                key={chat.conversation_id}
                value={`chat-${chat.conversation_id}`}
                onSelect={run(() => navigate(`/chat/${chat.conversation_id}`))}
              >
                <MessageSquare aria-hidden="true" />
                <span className="truncate">{conversationLabel(chat)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {documents.length > 0 && (
          <CommandGroup heading="Documents">
            {documents.map((document) => (
              <CommandItem
                key={document.document_id}
                value={`doc-${document.document_id}`}
                onSelect={run(() =>
                  navigate(`/documents/${document.document_id}`),
                )}
              >
                <FileText aria-hidden="true" />
                <span className="truncate">{document.filename}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {collections.length > 0 && (
          <CommandGroup heading="Collections">
            {collections.map((collection) => (
              <CommandItem
                key={collection.collection_id}
                value={`col-${collection.collection_id}`}
                onSelect={run(() =>
                  navigate(`/documents?collection=${collection.collection_id}`),
                )}
              >
                <FolderOpen aria-hidden="true" />
                <span className="truncate">{collection.name}</span>
                <span className="ml-auto text-meta tabular-nums text-muted-foreground">
                  {collection.document_count}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {documentsPending && documents.length === 0 && (
          <CommandPrimitive.Loading>
            <p className="px-2.5 py-3 text-body text-muted-foreground">
              Searching documents…
            </p>
          </CommandPrimitive.Loading>
        )}

        {!hasResults && !documentsPending && (
          <EmptyState>
            No results for <span className="text-foreground">“{query}”</span>.
          </EmptyState>
        )}
      </CommandList>

      <div className="hidden items-center gap-4 border-t border-border px-4 py-2.5 text-meta text-muted-foreground sm:flex">
        <Hint keys="↑ ↓">to move</Hint>
        <Hint keys="↵">to open</Hint>
        <Hint keys="esc">to close</Hint>
      </div>
    </Command>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <output className="block px-2.5 py-10 text-center text-body text-muted-foreground">
      {children}
    </output>
  );
}

function Hint({ keys, children }: { keys: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-sans text-meta">
        {keys}
      </kbd>
      {children}
    </span>
  );
}
