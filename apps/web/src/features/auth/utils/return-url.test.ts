import { describe, it, expect } from "vitest";
import { getSafeReturnUrl } from "./return-url";

describe("getSafeReturnUrl (FEAT-071 / AC-006)", () => {
  it("returns default URL when input is null, undefined, or empty", () => {
    expect(getSafeReturnUrl(null)).toBe("/");
    expect(getSafeReturnUrl(undefined)).toBe("/");
    expect(getSafeReturnUrl("")).toBe("/");
    expect(getSafeReturnUrl("   ")).toBe("/");
    expect(getSafeReturnUrl(null, "/dashboard")).toBe("/dashboard");
  });

  it("permits safe same-application relative paths", () => {
    expect(getSafeReturnUrl("/account")).toBe("/account");
    expect(getSafeReturnUrl("/academy/courses/intro")).toBe("/academy/courses/intro");
    expect(getSafeReturnUrl("/simulation?session=123")).toBe("/simulation?session=123");
    expect(getSafeReturnUrl("/community#post-456")).toBe("/community#post-456");
  });

  it("rejects absolute URLs with external protocols", () => {
    expect(getSafeReturnUrl("https://evil.com")).toBe("/");
    expect(getSafeReturnUrl("http://attacker.com/steal")).toBe("/");
    expect(getSafeReturnUrl("ftp://files.com")).toBe("/");
  });

  it("rejects protocol-relative URLs (open redirect vector)", () => {
    expect(getSafeReturnUrl("//evil.com")).toBe("/");
    expect(getSafeReturnUrl("//attacker.com/path")).toBe("/");
    expect(getSafeReturnUrl("///evil.com")).toBe("/");
  });

  it("rejects javascript: and other dangerous pseudo-protocols", () => {
    expect(getSafeReturnUrl("javascript:alert(1)")).toBe("/");
    expect(getSafeReturnUrl("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(getSafeReturnUrl("vbscript:msgbox")).toBe("/");
  });

  it("rejects backslash evasion attempts", () => {
    expect(getSafeReturnUrl("/\\evil.com")).toBe("/");
    expect(getSafeReturnUrl("\\evil.com")).toBe("/");
    expect(getSafeReturnUrl("/account\\evil.com")).toBe("/");
  });

  it("rejects CRLF / header injection attempts", () => {
    expect(getSafeReturnUrl("/account\r\nSet-Cookie:admin=true")).toBe("/");
    expect(getSafeReturnUrl("/account\nLocation:http://evil.com")).toBe("/");
    expect(getSafeReturnUrl("/account\0evil")).toBe("/");
  });
});
