import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Toaster } from "sonner";
import { useDarkMode } from "@/contexts/DarkModeContext";

// Sonner reads these variables, so the toasts use the app's tokens in light and dark
// without overriding its classes.
const TOAST_VARIABLES = {
  "--normal-bg": "var(--card)",
  "--normal-bg-hover": "var(--card)",
  "--normal-border": "var(--border)",
  "--normal-border-hover": "var(--border)",
  "--normal-text": "var(--card-foreground)",
  "--border-radius": "0.75rem",
} as CSSProperties;

/**
 * The app's single toast host. It follows the app's own light/dark choice (not the system
 * setting), sits at the bottom so it never covers the top bar's actions, and shows state
 * with a coloured icon instead of a coloured background.
 */
export function AppToaster() {
  const { darkMode } = useDarkMode();

  return (
    <Toaster
      theme={darkMode ? "dark" : "light"}
      position="bottom-right"
      closeButton
      style={TOAST_VARIABLES}
      toastOptions={{
        style: {
          fontFamily: "var(--font-sans)",
          boxShadow: "var(--ragify-shadow)",
        },
      }}
      icons={{
        success: <CheckCircle2 className="size-4 text-success" />,
        error: <AlertCircle className="size-4 text-destructive" />,
        warning: <TriangleAlert className="size-4 text-warning" />,
        info: <Info className="size-4 text-info" />,
        loading: (
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        ),
      }}
    />
  );
}
