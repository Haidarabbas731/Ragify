import { useCallback, useEffect, useState } from "react";

/**
 * Open state for the command menu, plus the Ctrl+K / ⌘K shortcut that toggles it.
 * The shortcut also works while typing in a field, which is what people expect from a palette.
 */
export function useCommandMenu() {
  const [open, setOpen] = useState(false);
  const toggle = useCallback(() => setOpen((value) => !value), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() === "k" &&
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        !event.shiftKey
      ) {
        // Stops Firefox from focusing the browser search bar.
        event.preventDefault();
        if (!event.repeat) toggle();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  return { open, setOpen, toggle };
}
