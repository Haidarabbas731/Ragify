import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { Button } from "@/components/ui/button";
import { ConversationHistory } from "./ConversationHistory";
import { SidebarNav } from "./SidebarNav";

interface AppSidebarProps {
  /** Called after any link is chosen, e.g. to close the mobile sheet. */
  onNavigate?: () => void;
}

/** The app sidebar: brand, New chat, main navigation and chat history. */
export function AppSidebar({ onNavigate }: AppSidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-card">
      <Link
        to="/dashboard"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5"
      >
        <Logo size={32} />
        <div className="leading-none">
          <div className="text-section text-foreground">Ragify</div>
          <div className="mt-1 text-overline font-normal text-muted-foreground">
            Knowledge OS
          </div>
        </div>
      </Link>

      <div className="px-3 pt-3">
        <Button asChild className="w-full justify-start">
          <Link to="/chat" onClick={onNavigate}>
            <Plus /> New chat
          </Link>
        </Button>
      </div>

      <SidebarNav onNavigate={onNavigate} />
      <div className="mx-3 border-t border-border" />
      <ConversationHistory onNavigate={onNavigate} />
    </div>
  );
}
