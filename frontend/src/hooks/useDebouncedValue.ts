import { useEffect, useState } from "react";

/**
 * Returns `value` after it has stopped changing for `delayMs`.
 * Useful for waiting until the user pauses typing before making a request.
 * @param value - The value to debounce
 * @param delayMs - How long the value must stay unchanged
 * @returns The latest value that stayed unchanged for the delay
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
