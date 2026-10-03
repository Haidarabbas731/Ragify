import { useEffect, useState } from "react";

/**
 * True the first time a page is opened in this browser session, false on every later visit.
 * Used to play a short entrance once, without repeating it each time someone returns.
 */
export function useFirstVisitThisSession(key: string): boolean {
  const [firstVisit] = useState(() => {
    try {
      return sessionStorage.getItem(key) === null;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage can be blocked; the entrance then simply never plays
    }
  }, [key]);

  return firstVisit;
}
