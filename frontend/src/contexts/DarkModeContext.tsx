/**
 * Dark Mode Context - Shared dark mode state across all components.
 *
 * Follows the system setting (`prefers-color-scheme`) until the user presses the toggle;
 * from then on their choice is remembered. A tiny script in `index.html` applies the same
 * rule before the first paint so the page never flashes the wrong theme.
 */

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface DarkModeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const STORAGE_KEY = "darkMode";
const SYSTEM_DARK_QUERY = "(prefers-color-scheme: dark)";

const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined,
);

/** The user's saved choice, or `null` when they have not picked one. */
function readSavedChoice(): boolean | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? null : Boolean(JSON.parse(saved));
  } catch {
    return null;
  }
}

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [savedChoice, setSavedChoice] = useState<boolean | null>(
    readSavedChoice,
  );
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia(SYSTEM_DARK_QUERY).matches,
  );

  // Keep up with the system setting while the user has not chosen
  useEffect(() => {
    const media = window.matchMedia(SYSTEM_DARK_QUERY);
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const darkMode = savedChoice ?? systemDark;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    const next = !darkMode;
    setSavedChoice(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Private mode: the choice still applies for this visit
    }
  }, [darkMode]);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}
