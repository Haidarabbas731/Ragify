import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneDark,
  oneLight,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useDarkMode } from "@/contexts/DarkModeContext";
import { Button } from "../ui/button";

interface CodeBlockProps {
  language?: string;
  value: string;
}

/** Syntax-highlighted code with a copy button; switches highlighting theme with dark mode. */
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
    <div className="my-4 overflow-hidden rounded-xl border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-1.5">
        <span className="text-meta text-muted-foreground">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="h-7 gap-1.5 px-2 text-meta text-muted-foreground"
        >
          {copied ? (
            <>
              <Check className="text-success" /> Copied
            </>
          ) : (
            <>
              <Copy /> Copy
            </>
          )}
        </Button>
      </div>

      <SyntaxHighlighter
        language={language}
        style={darkMode ? oneDark : oneLight}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.875rem",
          lineHeight: "1.6",
          background: "var(--card)",
          borderRadius: "0",
        }}
        codeTagProps={{
          style: { fontFamily: "var(--font-mono)", fontWeight: "normal" },
        }}
      >
        {value}
      </SyntaxHighlighter>
    </div>
  );
}
