/**
 * Markdown Content Component
 * Renders markdown content with syntax-highlighted code blocks
 * Supports GitHub Flavored Markdown (tables, strikethrough, task lists, etc.)
 */

import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { CodeBlock } from "./CodeBlock";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * MarkdownContent component for rendering markdown text
 * Uses react-markdown with GFM support and custom code blocks
 */
export function MarkdownContent({
  content,
  className = "",
}: MarkdownContentProps) {
  return (
    <div className={`prose prose-sm dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom code block rendering
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const inline = !match;
            const value = String(children).replace(/\n$/, "");

            // Inline code - Warm Library style
            if (inline) {
              return (
                <code
                  className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-['JetBrains_Mono'] text-sm rounded-md border border-amber-200/60 dark:border-amber-800/60 font-medium shadow-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Code block with syntax highlighting
            return <CodeBlock language={match[1]} value={value} />;
          },

          // Custom link styling
          a({ node, children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                {...props}
              >
                {children}
              </a>
            );
          },

          // Custom paragraph styling
          p({ node, children, ...props }) {
            return (
              <p
                className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-['Inter'] mb-3 last:mb-0"
                {...props}
              >
                {children}
              </p>
            );
          },

          // Custom heading styling
          h1({ node, children, ...props }) {
            return (
              <h1
                className="text-xl font-bold text-slate-900 dark:text-white font-['DM_Sans'] mb-3 mt-4 first:mt-0"
                {...props}
              >
                {children}
              </h1>
            );
          },
          h2({ node, children, ...props }) {
            return (
              <h2
                className="text-lg font-bold text-slate-900 dark:text-white font-['DM_Sans'] mb-3 mt-4"
                {...props}
              >
                {children}
              </h2>
            );
          },
          h3({ node, children, ...props }) {
            return (
              <h3
                className="text-base font-semibold text-slate-900 dark:text-white font-['DM_Sans'] mb-2 mt-3"
                {...props}
              >
                {children}
              </h3>
            );
          },

          // Custom list styling
          ul({ node, children, ...props }) {
            return (
              <ul
                className="list-disc list-inside text-sm text-slate-700 dark:text-slate-200 font-['Inter'] space-y-1 mb-3"
                {...props}
              >
                {children}
              </ul>
            );
          },
          ol({ node, children, ...props }) {
            return (
              <ol
                className="list-decimal list-inside text-sm text-slate-700 dark:text-slate-200 font-['Inter'] space-y-1 mb-3"
                {...props}
              >
                {children}
              </ol>
            );
          },

          // Custom blockquote styling
          blockquote({ node, children, ...props }) {
            return (
              <blockquote
                className="border-l-4 border-blue-500 dark:border-blue-400 pl-4 py-2 my-3 bg-blue-50 dark:bg-blue-950/20 text-slate-700 dark:text-slate-200 italic font-['Inter']"
                {...props}
              >
                {children}
              </blockquote>
            );
          },

          // Custom table styling
          table({ node, children, ...props }) {
            return (
              <div className="overflow-x-auto my-3">
                <table
                  className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          thead({ node, children, ...props }) {
            return (
              <thead className="bg-slate-100 dark:bg-slate-800" {...props}>
                {children}
              </thead>
            );
          },
          th({ node, children, ...props }) {
            return (
              <th
                className="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider font-['DM_Sans']"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ node, children, ...props }) {
            return (
              <td
                className="px-4 py-2 text-sm text-slate-700 dark:text-slate-200 font-['Inter'] border-t border-slate-200 dark:border-slate-700"
                {...props}
              >
                {children}
              </td>
            );
          },

          // Custom horizontal rule
          hr({ node, ...props }) {
            return (
              <hr
                className="my-4 border-slate-200 dark:border-slate-700"
                {...props}
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
