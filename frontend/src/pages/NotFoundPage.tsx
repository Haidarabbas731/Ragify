import { ArrowLeft, LayoutDashboard, LogIn } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/shared/Wordmark";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";

/** Shown for any address that matches no route. Offers a way back that fits who is looking. */
export function NotFoundPage() {
  const { pathname, search, key } = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // `default` means this is the first page of the session, so there is nothing to go back to
  const canGoBack = key !== "default";

  useEffect(() => {
    const previous = document.title;
    document.title = "Page not found · Ragify";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-background px-6 py-6 sm:px-10">
      <Wordmark to={isAuthenticated ? "/dashboard" : "/"} />

      <main className="fade-in-soft mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-8 py-10">
        <div className="flex flex-col gap-3">
          <p className="text-meta font-medium text-muted-foreground">
            Error 404
          </p>
          <h1 className="text-display text-foreground">
            We couldn't find that page
          </h1>
          <p className="text-body text-muted-foreground">
            The address may be mistyped, or the page was moved or deleted.
          </p>
        </div>

        <p className="break-all text-body text-muted-foreground">
          Nothing exists at{" "}
          <mark className="rounded-sm bg-highlight px-1 py-0.5 font-mono text-meta text-highlight-foreground">
            {pathname}
            {search}
          </mark>
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isAuthenticated ? (
            <>
              <Button asChild size="lg">
                <Link to="/dashboard">
                  <LayoutDashboard /> Go to dashboard
                </Link>
              </Button>
              {canGoBack && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft /> Go back
                </Button>
              )}
            </>
          ) : (
            <>
              <Button asChild size="lg">
                <Link to="/login">
                  <LogIn /> Sign in
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/">Go to home</Link>
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
