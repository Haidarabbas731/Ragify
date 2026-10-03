import type { HighlighterCore, LanguageInput } from "shiki/core";

/**
 * Languages the chat can colour. Each loads only when a code block first needs it, so the
 * highlighter adds nothing to the page until an answer contains code.
 */
const LANGUAGES: Record<string, () => LanguageInput> = {
  bash: () => import("@shikijs/langs/bash"),
  c: () => import("@shikijs/langs/c"),
  cpp: () => import("@shikijs/langs/cpp"),
  csharp: () => import("@shikijs/langs/csharp"),
  css: () => import("@shikijs/langs/css"),
  diff: () => import("@shikijs/langs/diff"),
  dockerfile: () => import("@shikijs/langs/dockerfile"),
  go: () => import("@shikijs/langs/go"),
  html: () => import("@shikijs/langs/html"),
  java: () => import("@shikijs/langs/java"),
  javascript: () => import("@shikijs/langs/javascript"),
  json: () => import("@shikijs/langs/json"),
  jsx: () => import("@shikijs/langs/jsx"),
  kotlin: () => import("@shikijs/langs/kotlin"),
  markdown: () => import("@shikijs/langs/markdown"),
  php: () => import("@shikijs/langs/php"),
  python: () => import("@shikijs/langs/python"),
  ruby: () => import("@shikijs/langs/ruby"),
  rust: () => import("@shikijs/langs/rust"),
  sql: () => import("@shikijs/langs/sql"),
  swift: () => import("@shikijs/langs/swift"),
  toml: () => import("@shikijs/langs/toml"),
  tsx: () => import("@shikijs/langs/tsx"),
  typescript: () => import("@shikijs/langs/typescript"),
  xml: () => import("@shikijs/langs/xml"),
  yaml: () => import("@shikijs/langs/yaml"),
};

const ALIASES: Record<string, string> = {
  "c#": "csharp",
  "c++": "cpp",
  cs: "csharp",
  docker: "dockerfile",
  golang: "go",
  htm: "html",
  js: "javascript",
  md: "markdown",
  py: "python",
  rb: "ruby",
  rs: "rust",
  sh: "bash",
  shell: "bash",
  ts: "typescript",
  yml: "yaml",
  zsh: "bash",
};

let highlighter: Promise<HighlighterCore> | undefined;

/** Creates the highlighter once, loading shiki itself only on first use. */
function getHighlighter(): Promise<HighlighterCore> {
  highlighter ??= Promise.all([
    import("shiki/core"),
    import("shiki/engine/javascript"),
  ]).then(([core, engine]) =>
    core.createHighlighterCore({
      themes: [
        import("@shikijs/themes/github-light"),
        import("@shikijs/themes/github-dark"),
      ],
      langs: [],
      // The JavaScript engine needs no WebAssembly download
      engine: engine.createJavaScriptRegexEngine(),
    }),
  );
  return highlighter;
}

/** The loaded-language name for a markdown fence label, or `null` if it is not supported. */
export function resolveLanguage(label: string): string | null {
  const name = label.trim().toLowerCase();
  const language = ALIASES[name] ?? name;
  return language in LANGUAGES ? language : null;
}

/**
 * Highlights code to HTML with both light and dark colours as CSS variables, so a theme
 * switch needs no re-render. Returns `null` for languages that are not supported.
 * @param code - Source text
 * @param label - Language label from the markdown fence, e.g. `ts` or `python`
 */
export async function highlightCode(
  code: string,
  label: string,
): Promise<string | null> {
  const language = resolveLanguage(label);
  if (!language) return null;

  const instance = await getHighlighter();
  if (!instance.getLoadedLanguages().includes(language)) {
    await instance.loadLanguage(LANGUAGES[language]());
  }
  return instance.codeToHtml(code, {
    lang: language,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
