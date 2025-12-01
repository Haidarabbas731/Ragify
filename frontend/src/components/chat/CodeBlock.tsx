/**
 * Code Block Component
 * Syntax-highlighted code blocks with copy functionality
 * Uses react-syntax-highlighter for beautiful code display
 */

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useDarkMode } from "../../contexts/DarkModeContext";
import { Button } from "../ui/button";

interface CodeBlockProps {
  language?: string;
  value: string;
}

/**
 * CodeBlock component for displaying syntax-highlighted code
 * Supports copy to clipboard and automatic dark mode switching
 */
export function CodeBlock({ language = "text", value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { darkMode } = useDarkMode();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative group my-4 rounded-3xl overflow-hidden shadow-lg shadow-stone-200/50 dark:shadow-stone-900/50 border border-stone-200/80 dark:border-stone-700/80">
      {/* Language label + Copy button - Warm Library style */}
      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-amber-50 via-orange-50 to-rose-50 dark:from-amber-950 dark:via-orange-950 dark:to-rose-950 border-b border-stone-200/60 dark:border-stone-700/60">
        <span className="text-xs font-semibold text-stone-600 dark:text-stone-300 font-['Inter'] uppercase tracking-wide">
          {language}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-8 px-3 gap-1.5 rounded-xl bg-white/80 dark:bg-stone-800/80 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-stone-200 dark:border-stone-700 shadow-sm transition-all duration-200"
        >
          {copied ? (
            <>
              <Check
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400"
                strokeWidth={2.5}
              />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-['Inter'] font-medium">
                Copied
              </span>
            </>
          ) : (
            <>
              <Copy
                className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400"
                strokeWidth={2}
              />
              <span className="text-xs text-stone-600 dark:text-stone-400 font-['Inter'] font-medium">
                Copy
              </span>
            </>
          )}
        </Button>
      </div>

      {/* Code content */}
      <SyntaxHighlighter
        language={language}
        style={darkMode ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: "1.25rem",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          background: darkMode ? "#1c1917" : "#fafaf9",
          fontWeight: "normal",
          borderRadius: "0 0 1.5rem 1.5rem",
        }}
        codeTagProps={{
          style: {
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Source Code Pro', monospace",
            fontWeight: "normal",
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
