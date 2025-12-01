/**
 * Code Block Component
 * Syntax-highlighted code blocks with copy functionality
 * Uses react-syntax-highlighter for beautiful code display
 * Styled to match ChatPage purple/indigo theme
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
    <div className="relative group my-4 rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700">
      {/* Language label + Copy button */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 font-['Inter'] uppercase tracking-wide">
          {language}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 px-2.5 gap-1.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200"
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
                className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400"
                strokeWidth={2}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-['Inter'] font-medium">
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
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          background: darkMode ? "#0f172a" : "#f8fafc",
          fontWeight: "normal",
          borderRadius: "0",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              "'Fira Code', 'JetBrains Mono', 'Source Code Pro', monospace",
            fontWeight: "normal",
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
