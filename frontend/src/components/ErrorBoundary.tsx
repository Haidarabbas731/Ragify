/**
 * Global Error Boundary Component
 * Catches React errors (component crashes) and shows user-friendly error page
 * Prevents blank screens when components fail to render
 */

import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Component, type ReactNode } from "react";
import { Button } from "./ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console (in production, send to error tracking service)
    console.error("Error Boundary caught an error:", error);
    console.error("Error Info:", errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // In production, you might want to send this to an error tracking service
    // Example: Sentry, LogRocket, etc.
    // reportErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      // Fallback error page
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            {/* Error Card */}
            <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900 rounded-2xl p-8 shadow-2xl shadow-red-500/10">
              {/* Icon and Header */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mb-6 animate-pulse">
                  <AlertTriangle
                    className="w-10 h-10 text-white"
                    strokeWidth={2.5}
                  />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-['Space_Grotesk'] mb-2">
                  Oops! Something Went Wrong
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-['Inter'] text-lg">
                  We encountered an unexpected error. Don't worry, your data is
                  safe.
                </p>
              </div>

              {/* Error Details (collapsed by default) */}
              <div className="mb-6">
                <details className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300 font-['Inter'] hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Show technical details
                  </summary>
                  <div className="mt-4 space-y-3">
                    {this.state.error && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-['Inter'] mb-1">
                          Error Message:
                        </p>
                        <code className="block text-xs bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 p-3 rounded border border-red-200 dark:border-red-800 font-['Fira_Code'] whitespace-pre-wrap">
                          {this.state.error.toString()}
                        </code>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 font-['Inter'] mb-1">
                          Component Stack:
                        </p>
                        <code className="block text-xs bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 p-3 rounded border border-slate-200 dark:border-slate-700 font-['Fira_Code'] whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {this.state.errorInfo.componentStack}
                        </code>
                      </div>
                    )}
                  </div>
                </details>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReload}
                  className="gap-2 font-['Inter'] font-medium bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 border-0"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="gap-2 font-['Inter'] font-medium border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center">
                <p className="text-sm text-slate-600 dark:text-slate-400 font-['Inter']">
                  If this problem persists, please{" "}
                  <a
                    href="mailto:support@example.com"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    contact support
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Brand Footer */}
            <div className="text-center mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-['Inter']">
                Powered by{" "}
                <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent font-['Space_Grotesk']">
                  Ragify
                </span>
              </p>
            </div>
          </div>
        </div>
      );
    }

    // No error, render children normally
    return this.props.children;
  }
}
