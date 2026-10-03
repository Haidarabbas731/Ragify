import { Check, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { highlightCode } from "@/lib/highlight";
import { Button } from "../ui/button";

interface CodeBlockProps {
  language?: string;
  value: string;
}

// Wait for the text to stop changing so a streaming answer is coloured once it settles,
// not on every token.
const SETTLE_MS = 250;

/**
 * Code with a copy button. It shows as plain text straight away and is coloured as soon as
 * the highlighter has loaded; colours follow light/dark through CSS variables.
 */
export function CodeBlock({ language = "text", value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [html, setHtml] = useState<string | null>(null);
  const settled = useDebouncedValue(value, SETTLE_MS);

  useEffect(() => {
    let cancelled = false;
    highlightCode(settled, language)
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [settled, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Colours are only valid for the text they were made from
  const showHighlighted = html !== null && settled === value;

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

      {showHighlighted ? (
        <div
          className="code-block overflow-x-auto bg-card p-4"
          // Shiki escapes the source text; this is its own generated markup
          // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted highlighter output
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div className="code-block overflow-x-auto bg-card p-4">
          <pre>
            <code>{value}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
