import { formatDistanceToNow } from "date-fns";

type DateInput = string | number | Date | null | undefined;

const KB = 1024;
const MB = KB * 1024;
const GB = MB * 1024;

/** Formats a byte count as B, KB, MB or GB (e.g. `135.3 KB`). */
export function formatBytes(bytes: number): string {
  if (bytes < KB) return `${bytes} B`;
  if (bytes < MB) return `${(bytes / KB).toFixed(1)} KB`;
  if (bytes < GB) return `${(bytes / MB).toFixed(1)} MB`;
  return `${(bytes / GB).toFixed(2)} GB`;
}

interface FormatDateOptions {
  /** Append hours and minutes. */
  withTime?: boolean;
  /** Include the year. Defaults to true. */
  withYear?: boolean;
  /** Returned when the value is empty. Defaults to an em dash. */
  fallback?: string;
}

/** Formats a date as `Jan 5, 2026`, optionally with the time. */
export function formatDate(
  value: DateInput,
  { withTime = false, withYear = true, fallback = "—" }: FormatDateOptions = {},
): string {
  if (!value) return fallback;
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    ...(withYear && { year: "numeric" }),
    ...(withTime && { hour: "2-digit", minute: "2-digit" }),
  });
}

/** Formats a time of day (e.g. `09:41 AM`). */
export function formatTime(value: DateInput): string {
  return new Date(value || Date.now()).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface FormatRelativeOptions {
  /** Returned when the value is empty. Defaults to an em dash. */
  fallback?: string;
  /** Switch to an absolute date once the value is older than this many days. */
  absoluteAfterDays?: number;
}

/** Formats a date relative to now (e.g. `3 days ago`). */
export function formatRelative(
  value: DateInput,
  { fallback = "—", absoluteAfterDays }: FormatRelativeOptions = {},
): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (
    absoluteAfterDays !== undefined &&
    Date.now() - date.getTime() > absoluteAfterDays * 86_400_000
  ) {
    return formatDate(date);
  }
  return formatDistanceToNow(date, { addSuffix: true });
}
