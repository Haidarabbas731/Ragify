import { useCallback, useEffect, useState } from "react";

export function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    if (saved !== null) {
      return JSON.parse(saved);
    }
    // Default to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    console.log("useEffect running, darkMode:", darkMode);
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = useCallback(() => {
    console.log("toggleDarkMode called");
    setDarkMode((prev: boolean) => {
      console.log("setDarkMode callback, prev:", prev, "new:", !prev);
      return !prev;
    });
  }, []);

  return { darkMode, toggleDarkMode };
}
