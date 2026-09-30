import {
  AI_INTENTS,
  type AIIntent,
  type AIRequestContextMode,
  type AIRefusalCode,
  normalizeAIMessage,
} from "@aura/shared";

export interface IntentClassificationResult {
  readonly intent: AIIntent;
  readonly confidence: number;
  readonly reason: string;
  readonly suggestedRefusalCode?: AIRefusalCode;
}

const VIETNAMESE_ACCENT_MAP: Record<string, string> = {
  à: "a", á: "a", ả: "a", ã: "a", ạ: "a",
  ă: "a", ằ: "a", ắ: "a", ẳ: "a", ẵ: "a", ặ: "a",
  â: "a", ầ: "a", ấ: "a", ẩ: "a", ẫ: "a", ậ: "a",
  è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
  ê: "e", ề: "e", ế: "e", ể: "e", ễ: "e", ệ: "e",
  ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
  ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
  ô: "o", ồ: "o", ố: "o", ổ: "o", ỗ: "o", ộ: "o",
  ơ: "o", ờ: "o", ớ: "o", ở: "o", ỡ: "o", ợ: "o",
  ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
  ư: "u", ừ: "u", ứ: "u", ử: "u", ữ: "u", ự: "u",
  ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
  đ: "d",
};

function removeDiacritics(str: string): string {
  return str
    .toLowerCase()
    .split("")
    .map((c) => VIETNAMESE_ACCENT_MAP[c] ?? c)
    .join("");
}

/**
 * Deterministic intent classifier implementing the approved P8-D08 closed intent taxonomy (FR-001, AC-001).
 * Fails closed to UNSUPPORTED_OR_REFUSED for unrecognized or non-financial inputs.
 */
export function classifyIntentDeterministic(
  rawMessage: string,
  contextHint?: AIRequestContextMode,
): IntentClassificationResult {
  const normalized = normalizeAIMessage(rawMessage);
  const lower = normalized.toLowerCase();
  const unaccented = removeDiacritics(lower);

  // 1. Prohibited Financial Action / Live Trading Requests
  const prohibitedTriggers = [
    "mua ngay",
    "ban ngay",
    "dat lenh that",
    "dat lenh ban het",
    "thuc hien giao dich",
    "chuyen tien",
    "nap tien",
    "rut tien",
    "mua ho",
    "ban ho",
    "buy 100 shares",
    "execute real trade",
    "place live order",
    "wire money",
    "transfer funds",
    "transfer money",
    "make me rich",
    "guaranteed returns",
    "guaranteed return",
    "guarantee profit",
    "guaranteed profit",
    "chac chan co lai",
    "chac chan sinh loi",
    "cam ket loi nhuan",
    "khuyen nghi mua",
    "khuyen nghi ban",
    "khuyen nghi ma",
    "phim hang",
    "tai khoan ngan hang",
    "what stocks to buy",
    "which stock to buy",
    "tell me which stock",
    "binance right now",
    "real brokerage account",
  ];
  if (prohibitedTriggers.some((t) => unaccented.includes(t))) {
    return {
      intent: AI_INTENTS.UNSUPPORTED_OR_REFUSED,
      confidence: 0.99,
      reason: "Request violates prohibited financial action policy",
      suggestedRefusalCode: "PROHIBITED_FINANCIAL_ACTION",
    };
  }

  // 2. Adversarial / Prompt Injection / Non-financial queries
  const injectionTriggers = [
    "ignore previous instructions",
    "system prompt",
    "developer mode",
    "jailbreak",
    "bo qua huong dan",
    "quen het quy tac",
    "ban la ai",
    "who are you",
    "viet mot bai tho",
    "write a poem",
    "thoi tiet hom nay",
    "what is the weather",
    "thu do cua phap",
    "capital of france",
  ];
  if (injectionTriggers.some((t) => unaccented.includes(t))) {
    return {
      intent: AI_INTENTS.UNSUPPORTED_OR_REFUSED,
      confidence: 0.95,
      reason: "Input is outside educational financial scope or contains adversarial directives",
      suggestedRefusalCode: "SAFETY_POLICY",
    };
  }

  // 3. Academy Guidance
  const academyTriggers = [
    "academy",
    "khoa hoc",
    "bai hoc",
    "quiz",
    "cau hoi trac nghiem",
    "cau hoi quiz",
    "kiem tra",
    "lesson",
    "course",
    "curriculum",
    "lo trinh hoc",
    "hoan thanh bai hoc",
    "hoc tiep bai gi",
    "giai thich dap an quiz",
    "pass quiz",
  ];
  const isAcademyMatch = academyTriggers.some((t) => unaccented.includes(t));
  if (isAcademyMatch || contextHint === "ACADEMY") {
    if (isAcademyMatch) {
      return {
        intent: AI_INTENTS.ACADEMY_GUIDANCE,
        confidence: 0.9,
        reason: "Matched Academy curriculum / lesson / quiz intent",
      };
    }
  }

  // 4. Simulation Analysis
  const simTriggers = [
    "simulation",
    "mo phong",
    "paper trade",
    "lenh limit",
    "lenh market",
    "lenh stop",
    "khop lenh mo phong",
    "tai khoan mo phong",
    "vi the mo phong",
    "short sell mo phong",
    "ban khong mo phong",
    "margin mo phong",
    "ky quy mo phong",
    "tai sao lenh bi tu choi",
    "simulated order",
    "simulated trade",
    "simulation balance",
  ];
  const isSimMatch = simTriggers.some((t) => unaccented.includes(t));
  if (isSimMatch || contextHint === "SIMULATION") {
    if (isSimMatch) {
      return {
        intent: AI_INTENTS.SIMULATION_ANALYSIS,
        confidence: 0.9,
        reason: "Matched simulated trading analysis intent",
      };
    }
  }

  // 5. Portfolio Education
  const portfolioTriggers = [
    "danh muc",
    "portfolio",
    "phan bo danh muc",
    "da dang hoa",
    "diversification",
    "rebalance",
    "tai can bang",
    "asset allocation",
    "ty trong",
    "weight",
    "portfolio variance",
    "do bien dong danh muc",
    "60/40",
  ];
  if (portfolioTriggers.some((t) => unaccented.includes(t))) {
    return {
      intent: AI_INTENTS.PORTFOLIO_EDUCATION,
      confidence: 0.88,
      reason: "Matched portfolio education and asset allocation intent",
    };
  }

  // 6. Learning Explanation
  const learningTriggers = [
    "la gi",
    "what is",
    "giai thich",
    "explain",
    "dinh gia",
    "valuation",
    "dcf",
    "p/e",
    "p/b",
    "ebitda",
    "sharpe",
    "beta",
    "var",
    "value at risk",
    "lam phat",
    "inflation",
    "lai suat",
    "interest rate",
    "trai phieu",
    "co phieu",
    "stock",
    "bond",
    "etf",
    "co tuc",
    "dividend",
    "thi truong chung khoan",
    "stock market",
    "ngan hang trung uong",
    "fed",
    "ti gia",
    "exchange rate",
  ];
  if (learningTriggers.some((t) => unaccented.includes(t))) {
    return {
      intent: AI_INTENTS.LEARNING_EXPLANATION,
      confidence: 0.85,
      reason: "Matched financial concept learning explanation intent",
    };
  }

  // 7. Context hint fallback
  if (contextHint === "ACADEMY") {
    return {
      intent: AI_INTENTS.ACADEMY_GUIDANCE,
      confidence: 0.6,
      reason: "Classified as Academy Guidance via contextual hint",
    };
  }
  if (contextHint === "SIMULATION") {
    return {
      intent: AI_INTENTS.SIMULATION_ANALYSIS,
      confidence: 0.6,
      reason: "Classified as Simulation Analysis via contextual hint",
    };
  }

  // 8. Fail Closed
  return {
    intent: AI_INTENTS.UNSUPPORTED_OR_REFUSED,
    confidence: 0.5,
    reason: "Query does not match any approved financial intent domain",
    suggestedRefusalCode: "UNSUPPORTED_REQUEST",
  };
}
