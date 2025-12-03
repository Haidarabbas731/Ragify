/**
 * Test Error Page - FOR TESTING ERROR BOUNDARY ONLY
 * This page intentionally throws an error to test the ErrorBoundary component
 * DELETE THIS FILE after testing
 */

import { useState } from "react";
import { Button } from "../components/ui/button";

export function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  // This will trigger the error boundary
  if (shouldError) {
    throw new Error(
      "Test error: This is an intentional error to test the ErrorBoundary!",
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 font-['Space_Grotesk']">
          Error Boundary Test Page
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8 font-['Inter']">
          Click the button below to intentionally trigger an error and see the
          Error Boundary in action.
        </p>

        <Button
          onClick={() => setShouldError(true)}
          className="gap-2 font-['Inter'] font-medium bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 border-0"
        >
          🧨 Trigger Error (Test Error Boundary)
        </Button>

        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-300 font-['Inter']">
            <strong>What will happen:</strong> When you click the button, this
            component will throw an error. The Error Boundary will catch it and
            display a beautiful error page with recovery options.
          </p>
        </div>

        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-900 dark:text-amber-300 font-['Inter']">
            ⚠️ <strong>Note:</strong> This is a test page. Delete{" "}
            <code>TestErrorPage.tsx</code> after testing.
          </p>
        </div>
      </div>
    </div>
  );
}
