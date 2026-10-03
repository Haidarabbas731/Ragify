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
