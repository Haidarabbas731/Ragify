import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Outlet, useLocation, useMatch } from "react-router-dom";
import { CommandMenu } from "@/components/command/CommandMenu";
import { NewSourceDialog } from "@/components/documents/NewSourceDialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { useCommandMenu } from "@/hooks/useCommandMenu";
import { useInfiniteConversations } from "@/hooks/useConversations";
import { conversationLabel } from "@/lib/conversations";
import { cn } from "@/lib/utils";
import { getRouteMeta } from "@/routeMeta";
import { AppSidebar } from "./AppSidebar";
import { Topbar } from "./Topbar";

/** What the shell shares with the page it renders, read with `useOutletContext`. */
export interface AppOutletContext {
  /** Opens the New source dialog. */
  openNewSource: () => void;
}

/** The signed-in app shell: sidebar, top bar and the routed page. */
export function AppLayout() {
  const queryClient = useQueryClient();
  const { pathname } = useLocation();
  const conversationId = useMatch("/chat/:conversationId")?.params
    .conversationId;
  const { data: history } = useInfiniteConversations();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newSourceOpen, setNewSourceOpen] = useState(false);
  const commandMenu = useCommandMenu();

  const isChat = pathname.startsWith("/chat");
  const meta = useMemo(() => {
    const base = getRouteMeta(pathname);
    if (!conversationId) return base;
    const current = history?.pages
      .flat()
      .find((c) => c.conversation_id === conversationId);
    return { ...base, title: current ? conversationLabel(current) : "Chat" };
  }, [pathname, conversationId, history]);

  return (
    <div className="overflow-locked flex h-dvh bg-background">
      <aside className="hidden w-[260px] shrink-0 border-r border-border lg:block">
        <AppSidebar />
      </aside>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] gap-0 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SheetDescription className="sr-only">
            Navigation and chat history
          </SheetDescription>
          <AppSidebar onNavigate={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="relative flex min-w-0 flex-1 flex-col">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          onOpenMenu={() => setMenuOpen(true)}
          onNewSource={() => setNewSourceOpen(true)}
          onOpenCommandMenu={commandMenu.toggle}
        />
        <main
          className={cn(
            "min-h-0 flex-1 pt-16",
            isChat ? "overflow-locked flex flex-col" : "overflow-y-auto",
          )}
        >
          <Outlet
            context={
              {
                openNewSource: () => setNewSourceOpen(true),
              } satisfies AppOutletContext
            }
          />
        </main>
      </div>

      <CommandMenu
        open={commandMenu.open}
        onOpenChange={commandMenu.setOpen}
        onNewSource={() => setNewSourceOpen(true)}
      />

      <NewSourceDialog
        open={newSourceOpen}
        onClose={() => setNewSourceOpen(false)}
        onUploadComplete={() => {
          queryClient.invalidateQueries({ queryKey: ["documents"] });
          queryClient.invalidateQueries({ queryKey: ["userStats"] });
        }}
      />
    </div>
  );
}
