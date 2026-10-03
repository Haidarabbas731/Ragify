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
        className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-5"
      >
        <Logo size={36} />
        <span className="text-brand text-foreground">Ragify</span>
      </Link>

      <div className="px-3 pt-3">
        <Button asChild size="sm" className="w-full justify-start">
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
