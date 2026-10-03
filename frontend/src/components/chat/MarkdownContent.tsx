import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { CodeBlock } from "./CodeBlock";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/** Renders markdown (GitHub flavored) with syntax-highlighted code blocks, styled with theme tokens. */
export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("min-w-0 max-w-none text-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const value = String(children).replace(/\n$/, "");

            if (!match) {
              return (
                <code
                  className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock language={match[1]} value={value} />;
          },
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2"
                {...props}
              >
                {children}
              </a>
            );
          },
          p({ node, children, ...props }) {
            return (
              <p
                className="mb-3 text-body leading-relaxed last:mb-0"
                {...props}
              >
                {children}
              </p>
            );
          },
          h1({ node, children, ...props }) {
            return (
              <h1 className="mb-3 mt-4 text-title first:mt-0" {...props}>
                {children}
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            return (
              <h2 className="mb-2 mt-4 text-section first:mt-0" {...props}>
                {children}
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            return (
              <h3 className="mb-2 mt-3 text-body font-semibold" {...props}>
                {children}
              </h3>
            );
          },
          ul({ node, children, ...props }) {
            return (
              <ul
                className="mb-3 flex list-disc flex-col gap-1 pl-5 text-body"
                {...props}
              >
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol
                className="mb-3 flex list-decimal flex-col gap-1 pl-5 text-body"
                {...props}
              >
                {children}
              </ol>
            );
          },
          blockquote({ node, children, ...props }) {
            return (
              <blockquote
                className="my-3 border-l-2 border-primary/40 py-1 pl-4 text-muted-foreground"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          table({ node, children, ...props }) {
            return (
              <div className="my-3 overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, children, ...props }) {
            return (
              <thead className="bg-muted" {...props}>
                {children}
              </thead>
            );
          },
          th({ node, children, ...props }) {
            return (
              <th
                className="px-3 py-2 text-left text-meta text-muted-foreground"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ node, children, ...props }) {
            return (
              <td
                className="border-t border-border px-3 py-2 text-body"
                {...props}
              >
                {children}
              </td>
            );
          },
          hr({ node, ...props }) {
            return <hr className="my-4 border-border" {...props} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
