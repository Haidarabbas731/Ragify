import { Link } from "react-router-dom";
import { Logo } from "@/components/shared/Logo";
import { useAuthStore } from "@/store/authStore";

const LINK_CLASS =
  "text-body text-muted-foreground transition-colors duration-150 ease-snap [@media(hover:hover)and(pointer:fine)]:hover:text-foreground";

/** Brand, the page's own sections and the ways in. Only links that go somewhere. */
export function LandingFooter() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-xs flex-col gap-3">
          <Link
            to="/"
            className="flex items-center gap-2.5"
            aria-label="Ragify"
          >
            <Logo size={32} />
            <span className="text-title text-foreground">Ragify</span>
          </Link>
          <p className="text-body text-muted-foreground">
            Ask your documents and see where every answer came from.
          </p>
        </div>

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-10 gap-y-3 sm:flex-col sm:gap-y-2"
        >
          <a href="#how-it-works" className={LINK_CLASS}>
            How it works
          </a>
          <a href="#why-ragify" className={LINK_CLASS}>
            Why Ragify
          </a>
          <a href="#faq" className={LINK_CLASS}>
            FAQ
          </a>
          {isAuthenticated ? (
            <Link to="/dashboard" className={LINK_CLASS}>
              Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className={LINK_CLASS}>
                Sign in
              </Link>
              <Link to="/register" className={LINK_CLASS}>
                Create account
              </Link>
            </>
          )}
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto w-full max-w-6xl px-6 py-5 text-meta text-muted-foreground">
          © {new Date().getFullYear()} Ragify
        </p>
      </div>
    </footer>
  );
}
