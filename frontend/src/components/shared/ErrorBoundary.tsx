import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

/** Catches render errors anywhere below it and shows a recovery page instead of a blank screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
    this.setState({ componentStack: errorInfo.componentStack ?? null });
  }

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <div
          role="alert"
          className="flex w-full max-w-lg flex-col items-center gap-6 rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--ragify-shadow)]"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" aria-hidden="true" />
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-display text-foreground">
              Something went wrong
            </h1>
            <p className="text-body text-muted-foreground">
              The page hit an unexpected error. Your documents and chats are
              safe. Reload to try again.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw /> Reload page
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <Home /> Go to home
            </Button>
          </div>

          {import.meta.env.DEV && (
            <details className="w-full rounded-xl border border-border bg-muted/40 p-4 text-left">
              <summary className="cursor-pointer text-body font-medium">
                Technical details
              </summary>
              <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap break-words font-mono text-meta text-muted-foreground">
                {error.toString()}
                {componentStack}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }
}
