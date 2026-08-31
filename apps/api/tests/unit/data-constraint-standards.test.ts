import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const standardsPath = path.resolve(currentDir, "../../../../docs/data-constraint-standards.md");

describe("FEAT-014 data constraint standards document", () => {
  const standards = fs.readFileSync(standardsPath, "utf-8");

  it("classifies reusable constraint rules as MUST, SHOULD, and DOMAIN-SPECIFIC DECISION", () => {
    expect(standards).toContain("MUST:");
    expect(standards).toContain("SHOULD:");
    expect(standards).toContain("DOMAIN-SPECIFIC DECISION:");
  });

  it("covers the required constraint categories without approving product-domain tables", () => {
    const requiredSections = [
      "UUID Primary Keys",
      "Foreign Keys",
      "Relationship Cardinality",
      "Required Fields And NOT NULL",
      "Unique Constraints",
      "Composite Unique Constraints",
      "Indexes",
      "Timestamps",
      "Enum And Status Integrity",
      "Cascade",
      "Restrict / No-Action",
      "Set-Null",
      "Concurrency And Integrity",
      "DB Constraints Vs Application Validation",
    ];

    for (const section of requiredSections) {
      expect(standards).toContain(section);
    }

    expect(standards).toContain("do not create product-domain tables");
    expect(standards).toContain("Application validation");
    expect(standards).toContain("must never be treated as a replacement for PostgreSQL constraints");
  });

  it("requires Human approval for destructive migrations and MUST-rule exceptions", () => {
    expect(standards).toContain("Destructive or data-loss migrations require explicit Human approval");
    expect(standards).toContain("Any exception to a MUST rule requires");
    expect(standards).toContain("explicit Human approval before implementation");
  });

  it("keeps global soft delete out of the Phase 3 baseline", () => {
    expect(standards).toContain("Global soft-delete convention");
    expect(standards).toContain("Soft delete is not approved globally");
  });
});
