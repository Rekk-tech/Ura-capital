import { PROHIBITED_COMPLIANCE_KEYWORDS } from "@aura/shared";

export interface ScanResult {
  isCompliant: boolean;
  flaggedKeywords: string[];
  snippet?: string;
}

export class ComplianceScannerService {
  private readonly prohibitedPatterns: Array<{ keyword: string; regex: RegExp }>;

  constructor() {
    this.prohibitedPatterns = PROHIBITED_COMPLIANCE_KEYWORDS.map((kw) => ({
      keyword: kw,
      regex: new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    }));
  }

  scanText(text: string): ScanResult {
    if (!text || typeof text !== "string") {
      return { isCompliant: true, flaggedKeywords: [] };
    }

    const flaggedKeywords: string[] = [];
    let matchedSnippet = "";

    for (const { keyword, regex } of this.prohibitedPatterns) {
      const match = text.match(regex);
      if (match && match.index !== undefined) {
        flaggedKeywords.push(keyword);
        if (!matchedSnippet) {
          const start = Math.max(0, match.index - 30);
          const end = Math.min(text.length, match.index + keyword.length + 30);
          matchedSnippet = `...${text.slice(start, end).trim()}...`;
        }
      }
    }

    return {
      isCompliant: flaggedKeywords.length === 0,
      flaggedKeywords,
      snippet: matchedSnippet || undefined,
    };
  }
}

export const complianceScannerService = new ComplianceScannerService();
