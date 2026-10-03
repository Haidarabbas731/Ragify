/** Page title and subtitle shown in the app top bar, keyed by pathname. */
export const ROUTE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard": {
    title: "Overview",
    subtitle: "Your knowledge base at a glance",
  },
  "/documents": {
    title: "Documents",
    subtitle: "All uploaded files and their status",
  },
  "/collections": {
    title: "Collections",
    subtitle: "Organise documents into groups",
  },
  "/profile": { title: "Profile", subtitle: "Manage your account settings" },
};

export const DEFAULT_ROUTE_META = { title: "Ragify", subtitle: "" };

/** Title and subtitle for any pathname, including dynamic chat and document routes. */
export function getRouteMeta(pathname: string): {
  title: string;
  subtitle: string;
} {
  if (pathname.startsWith("/chat")) return { title: "New chat", subtitle: "" };
  if (pathname.startsWith("/documents/")) {
    return { title: "Document", subtitle: "Details and indexed chunks" };
  }
  return ROUTE_META[pathname] ?? DEFAULT_ROUTE_META;
}
