import { Marked, type Token } from "marked";
import DOMPurify, { type Config } from "dompurify";

// Configure marked with raw HTML suppression as defense-in-depth
const markedInstance = new Marked({
  gfm: true,
  breaks: true,
});

markedInstance.use({
  walkTokens(token: Token) {
    if (token.type === "html") {
      // Suppress raw HTML tags - treat as empty/neutralized in parser output
      token.text = "";
    }
    if (token.type === "heading") {
      // DEF-021-02: Markdown headings render below page-level <h1> title.
      // # -> h2, ## -> h3, ..., clamped at h6.
      token.depth = Math.min(6, token.depth + 1);
    }
  },
});

const PURIFY_CONFIG: Config = {
  // DEF-021-02: h1 removed; only h2-h6 permitted from educational Markdown
  ALLOWED_TAGS: [
    "h2", "h3", "h4", "h5", "h6",
    "p", "b", "i", "strong", "em", "strike", "code", "pre",
    "ul", "ol", "li", "blockquote", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
    "span", "a", "br"
  ],
  ALLOWED_ATTR: ["href", "title", "target", "rel"],
  FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "button", "style", "link", "meta"],
  FORBID_ATTR: ["style", "srcdoc", "onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  ALLOW_DATA_ATTR: false,
};


/**
 * Sanitizes and renders lesson Markdown content to safe HTML.
 * DOMPurify acts as the mandatory final sanitization boundary.
 */
export function sanitizeLessonMarkdown(content: string | null | undefined): string {
  if (!content) {
    return "";
  }

  // 1. Parse Markdown with raw HTML suppression (defense-in-depth)
  const rawHtml = markedInstance.parse(content, { async: false }) as string;

  // 2. Add hook for external links to enforce rel="noopener noreferrer" and neutralize unsafe protocols
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      // Neutralize javascript:, data:, vbscript: links explicitly
      if (/^\s*(javascript|data|vbscript):/i.test(href)) {
        node.removeAttribute("href");
      }

      if (node.getAttribute("target") === "_blank" || /^https?:\/\//i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });

  // 3. Mandatory final DOMPurify sanitization
  const cleanHtml = DOMPurify.sanitize(rawHtml, PURIFY_CONFIG);

  // Clean up hooks
  DOMPurify.removeHook("afterSanitizeAttributes");

  return String(cleanHtml);
}
