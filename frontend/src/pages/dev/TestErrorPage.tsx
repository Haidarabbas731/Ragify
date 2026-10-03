import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Dev-only route (`/test-error`) that throws on purpose so the ErrorBoundary page can be checked. */
export function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error(
      "Test error: thrown on purpose to check the ErrorBoundary.",
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-8">
      <div className="flex w-full max-w-lg flex-col items-center gap-4 rounded-2xl border border-border bg-card p-8 text-center">
        <h1 className="text-display text-foreground">Error boundary test</h1>
        <p className="text-body text-muted-foreground">
          This page exists in development only. The button throws an error so
          you can see the recovery page.
        </p>
        <Button variant="destructive" onClick={() => setShouldError(true)}>
          Throw an error
        </Button>
      </div>
    </div>
  );
}
