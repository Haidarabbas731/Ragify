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
import { useDarkMode } from "../../hooks/useDarkMode";
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
    <div className="relative group my-3 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
      {/* Language label + Copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400 font-['DM_Sans'] uppercase tracking-wider">
          {language}
        </span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 px-2 gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              <span className="text-xs text-green-600 dark:text-green-400 font-['DM_Sans']">
                Copied!
              </span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-xs text-slate-600 dark:text-slate-400 font-['DM_Sans']">
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
          lineHeight: "1.5",
          background: darkMode ? "#1e293b" : "#f8fafc",
        }}
        codeTagProps={{
          style: {
            fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
          },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
