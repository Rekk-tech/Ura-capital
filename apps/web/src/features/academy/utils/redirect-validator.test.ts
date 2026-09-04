import { describe, it, expect } from "vitest";
import { isValidInternalRedirect, buildAuthRedirectUrl } from "./redirect-validator";

describe("redirect-validator (DEF-021-01 Hardened Internal Route Validation)", () => {
  describe("Positive Cases (Valid Internal Relative Paths)", () => {
    const validPaths = [
      "/academy",
      "/academy/courses/foo",
      "/academy/courses/foo/lessons/bar",
      "/academy?page=2",
      "/academy/courses/personal-finance-101",
      "/academy/courses/personal-finance-101/lessons/intro-to-budgeting",
      "/academy/courses/crypto-basics/lessons/l1?tab=resources&view=full",
    ];

    it.each(validPaths)("accepts valid internal relative application path: %s", (path) => {
      expect(isValidInternalRedirect(path)).toBe(true);
      const url = buildAuthRedirectUrl("/login", path);
      expect(url).toBe(`/login?redirect=${encodeURIComponent(path)}`);
    });
  });

  describe("Negative Cases (Non-string / Empty / Whitespace)", () => {
    const invalidInputs: (string | null | undefined)[] = [null, undefined, "", "   ", " \t \n "];

    it.each(invalidInputs)("rejects empty or non-string input: %s", (input) => {
      expect(isValidInternalRedirect(input)).toBe(false);
      const url = buildAuthRedirectUrl("/login", input);
      expect(url).toBe("/login?redirect=%2Facademy");
    });
  });


  describe("Negative Cases (Open Redirect & Protocol Vectors - DEF-021-01)", () => {
    const attackVectors: { name: string; vector: string }[] = [
      // Absolute external URLs
      { name: "absolute https URL", vector: "https://evil.example" },
      { name: "absolute http URL", vector: "http://evil.example" },
      { name: "absolute ftp URL", vector: "ftp://evil.example" },

      // Protocol-relative URLs
      { name: "protocol-relative double slash", vector: "//evil.example" },
      { name: "protocol-relative slash backslash", vector: "/\\evil.example" },
      { name: "protocol-relative double backslash", vector: "\\\\evil.example" },
      { name: "protocol-relative single backslash", vector: "\\evil.example" },

      // Dangerous schemes
      { name: "javascript pseudo-protocol", vector: "javascript:alert(1)" },
      { name: "data URI scheme", vector: "data:text/html,<script>alert(1)</script>" },
      { name: "vbscript URI scheme", vector: "vbscript:evil" },

      // Encoded slash/backslash variants (single & double encoded)
      { name: "encoded double backslash", vector: "/%5C%5Cevil.example" },
      { name: "encoded double slash", vector: "/%2F%2Fevil.example" },
      { name: "double-encoded double slash", vector: "/%252F%252Fevil.example" },
      { name: "double-encoded double backslash", vector: "/%255C%255Cevil.example" },
      { name: "mixed encoded and decoded slash/backslash", vector: "/%2F\\evil.example" },
      { name: "mixed encoded backslash and slash", vector: "/%5C//evil.example" },

      // Control characters & CRLF injection
      { name: "newline injection in path", vector: "/path\nnewline" },
      { name: "carriage return in path", vector: "/path\rreturn" },
      { name: "CRLF header injection in path", vector: "/path\r\nheader" },
      { name: "null byte in path", vector: "/path\x00null" },
      { name: "tab character in path", vector: "/path\tvalue" },

      // Leading / trailing whitespace attack forms
      { name: "leading whitespace before protocol-relative", vector: "  //evil.example" },
      { name: "trailing whitespace after protocol-relative", vector: "//evil.example  " },
      { name: "leading whitespace before absolute URL", vector: "  https://evil.example" },
      { name: "trailing whitespace after absolute URL", vector: "https://evil.example  " },
      { name: "leading tab before absolute URL", vector: "\thttps://evil.example" },
      { name: "leading newline before protocol-relative", vector: "\n//evil.example" },

      // Malformed percent encoding
      { name: "dangling percent", vector: "/%" },
      { name: "incomplete percent hex", vector: "/%2" },
      { name: "malformed utf-8 sequence", vector: "/%E0%A4%A" },

      // Internal scheme prefixes
      { name: "leading slash before https", vector: "/https://evil.example" },
      { name: "leading slash before javascript", vector: "/javascript:alert(1)" },
    ];

    it.each(attackVectors)("rejects $name: $vector", ({ vector }) => {
      // 1. Must be identified as invalid internal redirect
      expect(isValidInternalRedirect(vector)).toBe(false);

      // 2. buildAuthRedirectUrl MUST safely fallback to /academy, NOT attacker-controlled external target
      const loginUrl = buildAuthRedirectUrl("/login", vector);
      expect(loginUrl).toBe("/login?redirect=%2Facademy");
      expect(loginUrl).not.toContain("evil.example");
      expect(loginUrl).not.toContain("alert");

      const registerUrl = buildAuthRedirectUrl("/register", vector);
      expect(registerUrl).toBe("/register?redirect=%2Facademy");
      expect(registerUrl).not.toContain("evil.example");
      expect(registerUrl).not.toContain("alert");
    });
  });
});

