import { PrismaClient } from "@prisma/client";
import { passwordHashingService } from "../src/modules/auth/password-hashing.service.js";

/**
 * Idempotent Development & Demo Deployment Seed Script
 *
 * Populates essential application data required for immediate client walkthrough:
 * - Canonical roles (USER, ADMIN)
 * - Walkthrough user accounts (Demo Learner, Admin, community peers)
 * - Academy course curricula, lessons, and flashcards
 * - Simulation trading scenario, multi-asset ticker catalog, and market cycle snapshots
 * - Community forum discussion threads
 *
 * Safe & Idempotent:
 * - Can be executed repeatedly without duplication or data loss.
 * - Complies strictly with guard-seed-safety (zero prohibited fixture aliases or credential logging).
 */
async function main() {
  const seedPassword = process.env.DEV_SEED_USER_PASSWORD || "DevSeedPassword123!";
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("[SEED_DEV] Error: DATABASE_URL environment variable is required.");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const passwordHash = await passwordHashingService.hashPassword(seedPassword);

    await prisma.$transaction(async (tx) => {
      // 1. Roles
      const userRole = await tx.role.upsert({
        where: { name: "USER" },
        update: {},
        create: {
          name: "USER",
          description: "Standard registered user with default non-privileged access",
        },
      });

      const adminRole = await tx.role.upsert({
        where: { name: "ADMIN" },
        update: {},
        create: {
          name: "ADMIN",
          description: "Administrative operator role for server-controlled governance operations",
        },
      });

      // 2. Demo & Development Accounts
      const userFixtures = [
        {
          email: "alex.demo2026@aura.internal",
          displayName: "Alex Rivera",
          roleId: userRole.id,
        },
        {
          email: "admin.aura2026@aura.internal",
          displayName: "Aura System Admin",
          roleId: adminRole.id,
        },
        {
          email: "dev.user1@aura.internal",
          displayName: "Dev User 1",
          roleId: userRole.id,
        },
        {
          email: "dev.user2@aura.internal",
          displayName: "Dev User 2",
          roleId: userRole.id,
        },
      ];

      const createdUserMap = new Map<string, string>();

      for (const fixture of userFixtures) {
        const u = await tx.user.upsert({
          where: { email: fixture.email },
          update: {
            displayName: fixture.displayName,
            status: "ACTIVE",
          },
          create: {
            email: fixture.email,
            displayName: fixture.displayName,
            status: "ACTIVE",
          },
        });

        createdUserMap.set(fixture.email, u.id);

        await tx.credential.upsert({
          where: { userId: u.id },
          update: {
            passwordHash,
            version: 1,
          },
          create: {
            userId: u.id,
            type: "PASSWORD",
            passwordHash,
            version: 1,
          },
        });

        await tx.userRole.upsert({
          where: {
            userId_roleId: {
              userId: u.id,
              roleId: fixture.roleId,
            },
          },
          update: {},
          create: {
            userId: u.id,
            roleId: fixture.roleId,
          },
        });
      }

      console.log(`[SEED_DEV] Roles & ${userFixtures.length} user fixtures ensured.`);

      // 3. Academy Curricula, Lessons, Flashcards & Quizzes (from AURA_COURSES_CONTENT_PACK.md)
      interface SeedQuizOption {
        text: string;
        isCorrect: boolean;
      }

      interface SeedQuizQuestion {
        prompt: string;
        explanation: string;
        options: SeedQuizOption[];
      }

      interface SeedQuiz {
        title: string;
        description: string;
        passingScore: number;
        questions: SeedQuizQuestion[];
      }

      interface SeedFlashcard {
        front: string;
        back: string;
      }

      interface SeedLesson {
        slug: string;
        title: string;
        order: number;
        content: string;
        flashcards: SeedFlashcard[];
        quiz: SeedQuiz;
      }

      interface SeedCourse {
        slug: string;
        title: string;
        description: string;
        level: string;
        order: number;
        lessons: SeedLesson[];
      }

      const standaloneCourses: SeedCourse[] = [
        {
          slug: "investing-101",
          title: "Stock Investing 101",
          description: "Master fundamental stock analysis, market dynamics, and portfolio construction.",
          level: "BEGINNER",
          order: 1,
          lessons: [
            {
              slug: "market-basics",
              title: "Market Basics & Order Mechanics",
              order: 1,
              content: `# Market Basics & Order Mechanics

## Financial Market Foundations
Financial markets connect capital allocators with productive enterprise. In this lesson, learn how exchange matching engines process market and limit orders.

## Market Orders vs. Limit Orders
A **market order** executes immediately at the best available price — you get speed, not a guaranteed price. A **limit order** only executes at your specified price or better — you get price control, not a guaranteed fill. New investors often default to market orders for liquid, large-cap stocks and switch to limit orders in volatile or thinly-traded names.

## How the Matching Engine Works
Exchanges rank orders by **price priority** first, then **time priority**. Two limit buy orders at the same price are filled in the order they were received — this is why professional traders care about order placement speed, even outside high-frequency trading.`,
              flashcards: [
                {
                  front: "Market Order",
                  back: "An order to buy/sell immediately at the best available current price. (Ex: 'Buy 100 shares now' with no price limit.)",
                },
                {
                  front: "Limit Order",
                  back: "An order that only executes at a specified price or better. (Ex: 'Buy up to 50,000 VND, not higher.')",
                },
                {
                  front: "Price Priority",
                  back: "The matching rule where better-priced orders are filled before worse-priced ones.",
                },
                {
                  front: "Time Priority",
                  back: "Among orders at the same price, the earliest submitted order is filled first.",
                },
                {
                  front: "Order Book",
                  back: "The live list of all outstanding buy (bid) and sell (ask) orders for a security.",
                },
                {
                  front: "Bid-Ask Spread",
                  back: "The gap between the highest price a buyer will pay (bid) and the lowest price a seller will accept (ask).",
                },
              ],
              quiz: {
                title: "Market Basics & Order Mechanics Quiz",
                description: "Test your understanding of market and limit order execution mechanics.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "You place a market buy order during a fast-moving session. What do you give up?",
                    explanation: "Market orders guarantee speed, not the exact fill price.",
                    options: [
                      { text: "Price certainty", isCorrect: true },
                      { text: "Speed of execution", isCorrect: false },
                      { text: "The ability to cancel", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Two limit buy orders are placed at the identical price of 50,000 VND, one second apart. Which fills first?",
                    explanation: "At equal price, time priority decides.",
                    options: [
                      { text: "The larger order", isCorrect: false },
                      { text: "The one placed first (time priority)", isCorrect: true },
                      { text: "They fill simultaneously always", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "A stock's best bid is 49,800 and best ask is 50,000. What is the bid-ask spread?",
                    explanation: "50,000 − 49,800 = 200.",
                    options: [
                      { text: "200", isCorrect: true },
                      { text: "49,800", isCorrect: false },
                      { text: "50,000", isCorrect: false },
                    ],
                  },
                ],
              },
            },
            {
              slug: "order-books",
              title: "Order Book Depth & Spread",
              order: 2,
              content: `# Order Book Depth & Spread

## Reading Order Book Depth
"Depth" refers to the volume of buy/sell orders stacked at each price level. A deep order book (large volume near the current price) means large trades can execute with minimal price impact. A thin order book means even modest orders can swing the price significantly — a key risk in illiquid small-cap stocks.

## Why Spreads Widen
Spreads widen during high uncertainty (earnings releases, macro shocks) because market makers demand more compensation for the risk of holding inventory in a fast-moving market. Narrow spreads are a sign of high liquidity and competitive market-making.

## Practical Takeaway for Beginners
For your first trades, prefer liquid, well-known stocks with narrow spreads and deep order books — the cost of entry/exit (slippage) is much lower, letting you focus on learning strategy rather than fighting execution friction.`,
              flashcards: [
                {
                  front: "Market Depth",
                  back: "The volume of buy/sell orders available at each price level near the current price.",
                },
                {
                  front: "Slippage",
                  back: "The difference between the expected price of a trade and the price at which it actually executes.",
                },
                {
                  front: "Liquidity",
                  back: "How easily an asset can be bought or sold without significantly affecting its price.",
                },
                {
                  front: "Market Maker",
                  back: "A firm that continuously quotes both buy and sell prices to provide liquidity, earning the spread.",
                },
                {
                  front: "Thin Order Book",
                  back: "An order book with low volume at each price level, prone to large price swings on modest orders.",
                },
                {
                  front: "Price Impact",
                  back: "How much a trade itself moves the market price, larger for bigger orders in thin markets.",
                },
              ],
              quiz: {
                title: "Order Book Depth & Spread Quiz",
                description: "Test your understanding of market depth, liquidity, and slippage.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "A stock has very few orders stacked near the current price. This is called a ___ order book.",
                    explanation: "Low volume at each level = thin book.",
                    options: [
                      { text: "Deep", isCorrect: false },
                      { text: "Thin", isCorrect: true },
                      { text: "Balanced", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Why do spreads typically widen right before an earnings announcement?",
                    explanation: "Uncertainty increases the risk market makers must be compensated for.",
                    options: [
                      { text: "Lower trading volume overall", isCorrect: false },
                      { text: "Market makers price in higher uncertainty risk", isCorrect: true },
                      { text: "Exchanges charge higher fees that day", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "For a beginner's first few trades, which type of stock minimizes slippage risk?",
                    explanation: "Liquidity and deep order books reduce slippage.",
                    options: [
                      { text: "A thinly-traded small-cap", isCorrect: false },
                      { text: "A liquid, well-known large-cap", isCorrect: true },
                      { text: "Whichever has the highest expected return", isCorrect: false },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          slug: "personal-finance-risk",
          title: "Personal Finance & Risk Profiling",
          description: "Build the financial foundation before you invest: budgeting, compounding, and understanding your own risk tolerance.",
          level: "BEGINNER",
          order: 2,
          lessons: [
            {
              slug: "budgeting-compounding",
              title: "Budgeting & the Power of Compounding",
              order: 1,
              content: `# Budgeting & the Power of Compounding

## Pay Yourself First
Before investing a single dong, build an **emergency fund** covering 3–6 months of essential expenses in cash or a savings account. Investing without this buffer forces you to sell investments at the worst possible time — exactly when markets are down and you need cash urgently.

## Compound Interest, Explained Simply
Compounding means your returns start earning their own returns. FV = PV × (1 + r)^n. A modest 8%/year return doubles your money roughly every 9 years (the "Rule of 72": 72 / 8 ≈ 9). Starting 10 years earlier can matter more than the amount you invest each month.

## The 50/30/20 Rule
A simple budgeting framework: 50% of income to needs (rent, food), 30% to wants (entertainment), 20% to savings/investing. It's a starting template, not a rigid law — adjust based on your actual cost of living.`,
              flashcards: [
                {
                  front: "Emergency Fund",
                  back: "Cash reserve covering 3–6 months of essential expenses, kept outside of investments.",
                },
                {
                  front: "Compound Interest",
                  back: "Interest calculated on both the initial principal and the accumulated interest from prior periods.",
                },
                {
                  front: "Rule of 72",
                  back: "A quick estimate: years to double an investment ≈ 72 ÷ annual return rate (%).",
                },
                {
                  front: "50/30/20 Rule",
                  back: "A budgeting split: 50% needs, 30% wants, 20% savings/investing.",
                },
                {
                  front: "Opportunity Cost",
                  back: "The potential gain given up by choosing one financial option over another.",
                },
                {
                  front: "Dollar-Cost Averaging (DCA)",
                  back: "Investing a fixed amount at regular intervals regardless of price, reducing timing risk.",
                },
              ],
              quiz: {
                title: "Budgeting & Compounding Quiz",
                description: "Test your knowledge of budgeting principles and compounding mechanics.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "Why build an emergency fund before investing?",
                    explanation: "Avoids selling investments at a bad time to cover emergencies.",
                    options: [
                      { text: "It earns higher returns than stocks", isCorrect: false },
                      { text: "It prevents forced selling of investments during emergencies", isCorrect: true },
                      { text: "It is required by law", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Using the Rule of 72, approximately how many years to double money at 9%/year?",
                    explanation: "72 ÷ 9 = 8.",
                    options: [
                      { text: "4 years", isCorrect: false },
                      { text: "8 years", isCorrect: true },
                      { text: "16 years", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "In the 50/30/20 rule, what does the \"20\" represent?",
                    explanation: "20% is allocated to savings/investing.",
                    options: [
                      { text: "Taxes", isCorrect: false },
                      { text: "Wants/entertainment", isCorrect: false },
                      { text: "Savings and investing", isCorrect: true },
                    ],
                  },
                ],
              },
            },
            {
              slug: "risk-profiles-inflation",
              title: "Risk Profiles & Inflation Dynamics",
              order: 2,
              content: `# Risk Profiles & Inflation Dynamics

## What Is a Risk Profile?
Your risk profile combines **risk capacity** (how much loss you can financially absorb — depends on age, income stability, time horizon) and **risk tolerance** (how much volatility you can psychologically handle without panic-selling). A 25-year-old with stable income typically has higher capacity than a retiree, regardless of personality.

## Why Inflation Erodes "Safe" Cash
Holding 100% cash feels safe but guarantees a loss of purchasing power when inflation exceeds your cash's interest rate. If inflation is 4% and your savings account pays 2%, your real return is **−2%/year** — you're losing money in real terms even as the number on your statement grows.

## Matching Assets to Time Horizon
Money needed within 1–2 years belongs in cash/short-term instruments. Money not needed for 5+ years can tolerate equity volatility, since historically equities have outpaced inflation over long horizons — though with no guarantee in any single period.`,
              flashcards: [
                {
                  front: "Risk Capacity",
                  back: "The objective financial ability to absorb investment losses, based on income, age, obligations.",
                },
                {
                  front: "Risk Tolerance",
                  back: "The psychological/emotional comfort with investment volatility.",
                },
                {
                  front: "Real Return",
                  back: "Nominal return minus inflation — the actual change in purchasing power.",
                },
                {
                  front: "Purchasing Power",
                  back: "The quantity of goods/services a unit of currency can buy; eroded by inflation.",
                },
                {
                  front: "Time Horizon",
                  back: "The length of time before an investor expects to need the invested funds.",
                },
                {
                  front: "Inflation",
                  back: "A sustained increase in the general price level, reducing the value of money over time.",
                },
              ],
              quiz: {
                title: "Risk Profiles & Inflation Quiz",
                description: "Test your understanding of risk capacity, risk tolerance, and inflation.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "A young investor with stable income and no dependents likely has ___ risk capacity.",
                    explanation: "Fewer near-term obligations and a long horizon raise capacity.",
                    options: [
                      { text: "Low", isCorrect: false },
                      { text: "High", isCorrect: true },
                      { text: "Zero", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Inflation is 5%, your savings account pays 3%. What is your approximate real return?",
                    explanation: "3% − 5% = −2% real return.",
                    options: [
                      { text: "+2%", isCorrect: false },
                      { text: "−2%", isCorrect: true },
                      { text: "+8%", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Money you will need in 12 months should generally be held in:",
                    explanation: "Short time horizons require low-volatility, liquid holdings.",
                    options: [
                      { text: "Growth equities", isCorrect: false },
                      { text: "Cash or short-term instruments", isCorrect: true },
                      { text: "Options contracts", isCorrect: false },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          slug: "reading-financial-statements",
          title: "Reading Financial Statements",
          description: "Go beyond the stock price — learn to read the three financial statements and spot red flags.",
          level: "INTERMEDIATE",
          order: 3,
          lessons: [
            {
              slug: "three-statements",
              title: "The Three Statements",
              order: 1,
              content: `# The Three Statements

## The Income Statement
Shows revenue, expenses, and **net profit** over a period. Key insight: profit is an accounting opinion shaped by estimates (depreciation, provisions) — it is not the same as cash actually collected.

## The Balance Sheet
A snapshot at one point in time: Assets = Liabilities + Equity. Watch the **debt-to-equity ratio**; a highly leveraged balance sheet amplifies both gains and losses.

## The Cash Flow Statement — The Lie Detector
Splits into Operating, Investing, and Financing activities. A company can report rising profit while **Operating Cash Flow (OCF)** is negative for several periods — often a sign revenue is booked faster than cash is collected (rising receivables), a classic early warning sign.`,
              flashcards: [
                {
                  front: "Net Profit",
                  back: "Revenue minus all expenses, taxes, and costs; the 'bottom line' of the income statement.",
                },
                {
                  front: "Balance Sheet",
                  back: "A snapshot of assets, liabilities, and equity at a specific point in time.",
                },
                {
                  front: "Debt-to-Equity Ratio",
                  back: "Total liabilities divided by shareholders' equity; measures financial leverage.",
                },
                {
                  front: "Operating Cash Flow (OCF)",
                  back: "Cash generated from core business operations, excluding financing/investing activities.",
                },
                {
                  front: "Accounts Receivable",
                  back: "Money owed to a company by customers for goods/services already delivered.",
                },
                {
                  front: "Depreciation",
                  back: "The systematic allocation of an asset's cost over its useful life; a non-cash expense.",
                },
                {
                  front: "Quality of Earnings",
                  back: "How well reported profit is backed by actual cash generation, not accounting estimates.",
                },
              ],
              quiz: {
                title: "The Three Statements Quiz",
                description: "Test your understanding of income statements, balance sheets, and cash flow.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "Which statement is most useful for detecting if 'profit' is backed by real cash?",
                    explanation: "The cash flow statement reconciles profit with actual cash movement.",
                    options: [
                      { text: "Income Statement", isCorrect: false },
                      { text: "Balance Sheet", isCorrect: false },
                      { text: "Cash Flow Statement", isCorrect: true },
                    ],
                  },
                  {
                    prompt: "A company's profit rises 50% but receivables triple and OCF is negative. What's the likely concern?",
                    explanation: "Rising receivables + negative OCF is a classic earnings-quality red flag.",
                    options: [
                      { text: "Excellent cash generation", isCorrect: false },
                      { text: "Low quality of earnings; revenue not yet collected", isCorrect: true },
                      { text: "The company has no debt", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Depreciation is best described as:",
                    explanation: "It reduces reported profit without an actual cash payment that period.",
                    options: [
                      { text: "A cash outflow each period", isCorrect: false },
                      { text: "A non-cash expense spreading asset cost over time", isCorrect: true },
                      { text: "A liability on the balance sheet", isCorrect: false },
                    ],
                  },
                ],
              },
            },
            {
              slug: "valuation-ratios-pe-pb",
              title: "Valuation Ratios — P/E & P/B",
              order: 2,
              content: `# Valuation Ratios — P/E & P/B

## Price-to-Earnings (P/E)
P/E = Share Price / EPS. A P/E of 15 implies roughly 15 years to "earn back" the price paid, assuming flat earnings. Low P/E can mean a bargain — or a value trap if earnings are structurally declining.

## Price-to-Book (P/B)
P/B = Share Price / Book Value per Share. Most useful for asset-heavy sectors (banks, real estate, steel). A P/B below 1.0 means the market values the company below its net asset value on the books.

## Why Ratios Need Context
Never compare P/E across unrelated industries — a tech growth stock and a utility company have structurally different "normal" P/E ranges. Always compare against industry peers and the company's own historical range.`,
              flashcards: [
                {
                  front: "P/E Ratio",
                  back: "Share price divided by earnings per share (EPS); a measure of how much investors pay per dollar of earnings.",
                },
                {
                  front: "EPS (Earnings Per Share)",
                  back: "Net profit divided by the number of outstanding shares.",
                },
                {
                  front: "P/B Ratio",
                  back: "Share price divided by book value per share; compares market price to net asset value.",
                },
                {
                  front: "Book Value",
                  back: "Total assets minus total liabilities — the accounting net worth of a company.",
                },
                {
                  front: "Value Trap",
                  back: "A stock that looks cheap on ratios but keeps falling because the underlying business is deteriorating.",
                },
                {
                  front: "Peer Comparison",
                  back: "Evaluating a company's ratios against others in the same industry, not the market overall.",
                },
              ],
              quiz: {
                title: "Valuation Ratios Quiz",
                description: "Test your understanding of P/E, P/B, and relative valuation.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "A stock has a price of 60,000 VND and EPS of 4,000 VND. What is its P/E?",
                    explanation: "60,000 ÷ 4,000 = 15.",
                    options: [
                      { text: "4", isCorrect: false },
                      { text: "15", isCorrect: true },
                      { text: "24", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "A bank trades at P/B = 0.8. What does this suggest?",
                    explanation: "P/B < 1 means price is below book value.",
                    options: [
                      { text: "The market values it above its net assets", isCorrect: false },
                      { text: "The market values it below its net assets (book value)", isCorrect: true },
                      { text: "P/B doesn't apply to banks", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Comparing a tech growth stock's P/E directly to a utility company's P/E is problematic because:",
                    explanation: "Valuation multiples should be compared within the same industry context.",
                    options: [
                      { text: "P/E never applies to tech stocks", isCorrect: false },
                      { text: "Different industries have structurally different normal P/E ranges", isCorrect: true },
                      { text: "Utilities don't report earnings", isCorrect: false },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          slug: "technical-analysis-essentials",
          title: "Technical Analysis Essentials",
          description: "Read candlestick patterns, support/resistance zones, and the two most common technical indicators.",
          level: "INTERMEDIATE",
          order: 4,
          lessons: [
            {
              slug: "candlestick-patterns",
              title: "Candlestick Patterns",
              order: 1,
              content: `# Candlestick Patterns

## Anatomy of a Candle
Each candle shows Open, High, Low, Close for a period. A long body signals one side (buyers or sellers) dominated; a long wick signals a strong price rejection at that extreme.

## Three Key Patterns
**Doji** (open ≈ close): indecision between buyers and sellers. **Hammer / Pin Bar** (long lower wick): rejection of lower prices, potential bullish reversal after a downtrend. **Shooting Star** (long upper wick): rejection of higher prices, potential bearish reversal after an uptrend.

## Patterns Need Context, Not Just Shape
A hammer appearing randomly mid-trend means little. The same hammer appearing after a sustained downtrend, with above-average volume, is a far stronger reversal signal. Always read candles in the context of trend and volume.`,
              flashcards: [
                {
                  front: "Candlestick",
                  back: "A chart element showing a period's Open, High, Low, and Close prices.",
                },
                {
                  front: "Doji",
                  back: "A candle where open and close are nearly equal, signaling market indecision.",
                },
                {
                  front: "Hammer (Pin Bar)",
                  back: "A candle with a small body and long lower wick, often a bullish reversal signal after a downtrend.",
                },
                {
                  front: "Shooting Star",
                  back: "A candle with a small body and long upper wick, often a bearish reversal signal after an uptrend.",
                },
                {
                  front: "Uptrend",
                  back: "A price pattern of higher highs and higher lows.",
                },
                {
                  front: "Downtrend",
                  back: "A price pattern of lower highs and lower lows.",
                },
                {
                  front: "Volume Confirmation",
                  back: "Using trading volume to validate the strength of a price pattern or signal.",
                },
              ],
              quiz: {
                title: "Candlestick Patterns Quiz",
                description: "Test your ability to recognize and interpret candlestick patterns.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "A candle with a long lower wick and small body, appearing after a steep downtrend, is called a:",
                    explanation: "Long lower wick + small body + after downtrend = hammer.",
                    options: [
                      { text: "Shooting Star", isCorrect: false },
                      { text: "Hammer", isCorrect: true },
                      { text: "Doji", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "A Doji candle primarily signals:",
                    explanation: "Open ≈ Close reflects a standoff, not a clear winner.",
                    options: [
                      { text: "Strong bullish momentum", isCorrect: false },
                      { text: "Strong bearish momentum", isCorrect: false },
                      { text: "Indecision between buyers and sellers", isCorrect: true },
                    ],
                  },
                  {
                    prompt: "Why does volume matter when interpreting a reversal candle?",
                    explanation: "Volume confirms whether a pattern reflects genuine participation.",
                    options: [
                      { text: "It doesn't — shape alone is enough", isCorrect: false },
                      { text: "High volume adds confirmation that the move reflects real conviction", isCorrect: true },
                      { text: "Low volume always means the signal is stronger", isCorrect: false },
                    ],
                  },
                ],
              },
            },
            {
              slug: "support-resistance-indicators",
              title: "Support, Resistance & Indicators (MA, RSI)",
              order: 2,
              content: `# Support, Resistance & Indicators (MA, RSI)

## Support & Resistance Are Zones, Not Lines
Think of support/resistance as price zones where supply/demand have historically clashed, not an exact number. A "broken" resistance zone (on strong volume) often flips to become new support — this is called **role reversal**.

## Moving Averages (MA)
The MA smooths price noise to reveal trend direction. A common signal: price crossing above its 50-day MA suggests strengthening short/medium-term momentum; crossing below suggests weakening momentum.

## Relative Strength Index (RSI)
RSI oscillates 0–100, measuring the speed/magnitude of recent price moves. Conventionally, RSI > 70 suggests "overbought" conditions (potential pullback), RSI < 30 suggests "oversold" (potential bounce) — but in strong trends, RSI can stay extreme for a long time, so it's a supporting signal, not a standalone trade trigger.`,
              flashcards: [
                {
                  front: "Support",
                  back: "A price zone where buying pressure has historically been strong enough to halt declines.",
                },
                {
                  front: "Resistance",
                  back: "A price zone where selling pressure has historically been strong enough to halt advances.",
                },
                {
                  front: "Role Reversal",
                  back: "When a broken resistance zone becomes new support (or vice versa).",
                },
                {
                  front: "Moving Average (MA)",
                  back: "The average price over a set number of periods, used to smooth short-term noise and show trend.",
                },
                {
                  front: "Golden Cross",
                  back: "When a shorter-term MA crosses above a longer-term MA, often seen as bullish.",
                },
                {
                  front: "RSI (Relative Strength Index)",
                  back: "A 0–100 momentum oscillator; conventionally >70 = overbought, <30 = oversold.",
                },
                {
                  front: "Overbought / Oversold",
                  back: "Conditions where price has risen/fallen quickly enough that a pullback/bounce becomes more likely.",
                },
              ],
              quiz: {
                title: "Support, Resistance & Indicators Quiz",
                description: "Test your knowledge of support/resistance dynamics, moving averages, and RSI.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "A resistance zone breaks on high volume, and price later pulls back to that same zone. What typically happens?",
                    explanation: "This is the classic 'role reversal' pattern.",
                    options: [
                      { text: "The zone has no further relevance", isCorrect: false },
                      { text: "The zone often flips to become new support", isCorrect: true },
                      { text: "Price always crashes through it again", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "RSI reads 85 on a stock. What does this conventionally suggest?",
                    explanation: "RSI > 70 is conventionally read as overbought, a caution signal, not a certainty.",
                    options: [
                      { text: "Oversold, likely to bounce", isCorrect: false },
                      { text: "Overbought, a pullback is more likely (not guaranteed)", isCorrect: true },
                      { text: "The stock is guaranteed to crash", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "A \"Golden Cross\" refers to:",
                    explanation: "Golden Cross = short-term MA crossing above long-term MA, a bullish signal.",
                    options: [
                      { text: "A shorter-term MA crossing below a longer-term MA", isCorrect: false },
                      { text: "A shorter-term MA crossing above a longer-term MA", isCorrect: true },
                      { text: "RSI crossing above 70", isCorrect: false },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          slug: "advanced-derivatives",
          title: "Options & Derivatives Trading",
          description: "Strategic option contracts, risk hedging, and volatility positioning.",
          level: "ADVANCED",
          order: 5,
          lessons: [
            {
              slug: "options-fundamentals",
              title: "Options Fundamentals — Calls, Puts & Hedging",
              order: 1,
              content: `# Options Fundamentals — Calls, Puts & Hedging

## Calls and Puts, Simply
A **call option** gives the right (not obligation) to **buy** an asset at a fixed **strike price** before expiry — buyers profit if the price rises above the strike plus premium paid. A **put option** gives the right to **sell** at the strike — buyers profit if the price falls below the strike minus premium paid.

## Why Investors Use Options: Hedging
A portfolio holder worried about a short-term downturn can buy **put options** as insurance: if the portfolio falls, the puts gain value, offsetting losses — at the cost of the premium paid, similar to an insurance premium that expires worthless if no downturn occurs.

## The Cost of Leverage: Why Options Can Expire Worthless
Unlike owning the stock outright, an option has an **expiry date**. If the price doesn't move favorably enough before expiry, the option can lose its entire premium value — this asymmetric, time-limited risk is why options require more risk discipline than straightforward stock ownership.

## Core Vocabulary for Pricing
Option premiums are driven by **intrinsic value** (how far in-the-money the option is) plus **time value** (potential for the price to move favorably before expiry) and **implied volatility** (the market's expectation of future price swings — higher expected volatility raises premiums for both calls and puts).`,
              flashcards: [
                {
                  front: "Call Option",
                  back: "A contract giving the right (not obligation) to buy an asset at a fixed strike price before expiry.",
                },
                {
                  front: "Put Option",
                  back: "A contract giving the right (not obligation) to sell an asset at a fixed strike price before expiry.",
                },
                {
                  front: "Strike Price",
                  back: "The fixed price at which an option holder may buy (call) or sell (put) the underlying asset.",
                },
                {
                  front: "Premium",
                  back: "The price paid by the option buyer to the option seller for the contract.",
                },
                {
                  front: "Expiry Date",
                  back: "The date after which the option contract becomes void.",
                },
                {
                  front: "Hedging",
                  back: "Using a position (e.g., buying puts) to offset potential losses in another position.",
                },
                {
                  front: "Intrinsic Value",
                  back: "The amount an option is currently 'in the money' — its value if exercised right now.",
                },
                {
                  front: "Implied Volatility",
                  back: "The market's expectation of future price fluctuation, embedded in an option's premium.",
                },
              ],
              quiz: {
                title: "Options Fundamentals Quiz",
                description: "Test your understanding of call/put mechanics, hedging strategies, and pricing drivers.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "An investor buys a put option mainly to:",
                    explanation: "Puts gain value as the underlying falls, offsetting portfolio losses.",
                    options: [
                      { text: "Speculate on unlimited upside", isCorrect: false },
                      { text: "Hedge against a potential decline in a holding", isCorrect: true },
                      { text: "Guarantee a fixed dividend", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "What is the maximum loss for an option buyer (call or put)?",
                    explanation: "A buyer's downside is capped at the premium paid; it can expire worthless.",
                    options: [
                      { text: "Unlimited", isCorrect: false },
                      { text: "The premium paid", isCorrect: true },
                      { text: "Double the premium paid", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Rising implied volatility generally makes option premiums:",
                    explanation: "Higher expected future price swings raise the value of the optionality.",
                    options: [
                      { text: "Lower", isCorrect: false },
                      { text: "Higher", isCorrect: true },
                      { text: "Unaffected", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "An option with no intrinsic value is kept solely for its:",
                    explanation: "Out-of-the-money options derive value purely from remaining time value.",
                    options: [
                      { text: "Dividend potential", isCorrect: false },
                      { text: "Time value (chance of favorable movement before expiry)", isCorrect: true },
                      { text: "Guaranteed payout at expiry", isCorrect: false },
                    ],
                  },
                ],
              },
            },
          ],
        },
        {
          slug: "macro-cycles-portfolio",
          title: "Macro Cycles & Portfolio Construction",
          description: "Macroeconomic cycles, multi-asset portfolio hedging, and risk-adjusted performance measurement.",
          level: "ADVANCED",
          order: 6,
          lessons: [
            {
              slug: "interest-rates-asset-allocation",
              title: "Interest Rates, Inflation & Asset Allocation",
              order: 1,
              content: `# Interest Rates, Inflation & Asset Allocation

## The Rate Transmission Mechanism
When a central bank raises policy rates: savings become more attractive → capital rotates out of equities/real estate toward deposits/bonds → corporate borrowing costs rise → earnings growth slows → equity valuations compress. The reverse chain plays out when rates are cut.

## Which Assets Suffer Most From Rising Rates?
**Growth equities** (high P/E, profits weighted toward the distant future) are typically hit hardest, since their valuation relies heavily on discounting far-future cash flows at a higher rate. **Value equities** (steady cash flow, high current dividends) and **short-duration bonds** are comparatively more resilient.

## Building a Regime-Aware Allocation
Rather than predicting exact turning points, a disciplined investor adjusts **tilts** — modestly increasing defensive/value/bond weight as rates rise and inflation accelerates, and modestly increasing growth-equity weight as rates stabilize/fall and growth data improves — without abandoning diversification entirely in either regime.`,
              flashcards: [
                {
                  front: "Policy Rate",
                  back: "The benchmark interest rate set by a central bank, influencing borrowing costs economy-wide.",
                },
                {
                  front: "Rate Transmission",
                  back: "The chain of economic effects that follows a change in policy interest rates.",
                },
                {
                  front: "Discount Rate",
                  back: "The rate used to convert future cash flows into present value; rises with interest rates.",
                },
                {
                  front: "Growth Equity",
                  back: "A stock whose valuation is weighted toward future earnings growth, often at a high P/E.",
                },
                {
                  front: "Value Equity",
                  back: "A stock with steady current cash flows/dividends and typically lower P/E.",
                },
                {
                  front: "Duration (Bonds)",
                  back: "A measure of a bond's price sensitivity to interest rate changes; longer duration = more sensitive.",
                },
                {
                  front: "Regime-Aware Allocation",
                  back: "Adjusting portfolio tilts based on the current macro environment, without full market timing.",
                },
              ],
              quiz: {
                title: "Interest Rates & Asset Allocation Quiz",
                description: "Test your understanding of monetary policy transmission and asset class sensitivity.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "Why are growth stocks typically hit hardest when interest rates rise sharply?",
                    explanation: "Higher discount rates reduce the present value of far-future earnings most.",
                    options: [
                      { text: "They pay the highest dividends", isCorrect: false },
                      { text: "Their valuation relies on discounting distant future cash flows at a higher rate", isCorrect: true },
                      { text: "They have no revenue", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "A bond with longer duration is:",
                    explanation: "Duration measures rate sensitivity — longer duration = more price movement per rate change.",
                    options: [
                      { text: "Less sensitive to interest rate changes", isCorrect: false },
                      { text: "More sensitive to interest rate changes", isCorrect: true },
                      { text: "Immune to interest rate changes", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "\"Regime-aware allocation\" means:",
                    explanation: "It's about gradual tilting, not precise market timing.",
                    options: [
                      { text: "Predicting the exact top/bottom of the market", isCorrect: false },
                      { text: "Adjusting portfolio tilts gradually based on the macro environment", isCorrect: true },
                      { text: "Holding 100% cash during any uncertainty", isCorrect: false },
                    ],
                  },
                ],
              },
            },
            {
              slug: "risk-adjusted-returns",
              title: "Risk-Adjusted Returns — Sharpe, Alpha, Drawdown",
              order: 2,
              content: `# Risk-Adjusted Returns — Sharpe, Alpha, Drawdown

## Why Raw Returns Can Mislead
A portfolio returning 20%/year sounds better than one returning 12%/year — until you learn the first one swung ±40% along the way while the second swung ±8%. Risk-adjusted metrics let you compare returns **per unit of risk taken**.

## Sharpe Ratio
Sharpe = (Rp − Rf) / σp
where Rp = portfolio return, Rf = risk-free rate, σp = portfolio's standard deviation of returns. A Sharpe above 1.0 is generally considered good; above 2.0 is excellent — but always compare within a similar asset class and time period.

## Alpha vs. Benchmark
Alpha = Rp − Rbenchmark
Positive alpha means the portfolio outperformed its benchmark (e.g., VN-Index) on a like-for-like basis. Alpha alone, without considering the risk taken to achieve it, can be misleading — pair it with Sharpe or Max Drawdown.

## Max Drawdown
The largest peak-to-trough decline in portfolio value during a period. Two portfolios with identical final returns can have very different "ride" — one with a 40% max drawdown is psychologically and practically far harder to hold through than one with 12%, since recovering from a 40% loss requires a 67% subsequent gain just to break even.`,
              flashcards: [
                {
                  front: "Sharpe Ratio",
                  back: "Excess return (over the risk-free rate) divided by the standard deviation of returns; measures return per unit of risk.",
                },
                {
                  front: "Risk-Free Rate",
                  back: "The theoretical return of an investment with zero risk, often approximated by government short-term bonds.",
                },
                {
                  front: "Standard Deviation (σ)",
                  back: "A statistical measure of how much returns vary from their average; a common proxy for volatility/risk.",
                },
                {
                  front: "Alpha",
                  back: "The excess return of a portfolio relative to its benchmark index.",
                },
                {
                  front: "Benchmark",
                  back: "A reference index (e.g., VN-Index) used to evaluate relative portfolio performance.",
                },
                {
                  front: "Max Drawdown",
                  back: "The largest peak-to-trough decline in portfolio value over a given period.",
                },
                {
                  front: "Volatility",
                  back: "The degree of variation in an asset's or portfolio's returns over time.",
                },
              ],
              quiz: {
                title: "Risk-Adjusted Returns Quiz",
                description: "Test your ability to evaluate Sharpe ratios, alpha, and maximum drawdowns.",
                passingScore: 60,
                questions: [
                  {
                    prompt: "Portfolio A returns 20%/year with σ=30%; Portfolio B returns 12%/year with σ=8%. Which likely has the better Sharpe Ratio (assume Rf=3%)?",
                    explanation: "(12−3)/8 = 1.125 vs (20−3)/30 ≈ 0.57 — B has the better risk-adjusted return.",
                    options: [
                      { text: "Portfolio A", isCorrect: false },
                      { text: "Portfolio B", isCorrect: true },
                      { text: "Impossible to tell", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "A portfolio returns 15% while its benchmark returns 11%. What is its Alpha?",
                    explanation: "Alpha = 15% − 11% = +4%.",
                    options: [
                      { text: "+4%", isCorrect: true },
                      { text: "−4%", isCorrect: false },
                      { text: "+26%", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "After a 40% drawdown, what return is needed just to break even?",
                    explanation: "1/(1−0.40) − 1 ≈ 0.667 = 66.7%.",
                    options: [
                      { text: "40%", isCorrect: false },
                      { text: "67%", isCorrect: true },
                      { text: "100%", isCorrect: false },
                    ],
                  },
                  {
                    prompt: "Why is Max Drawdown important alongside total return?",
                    explanation: "Drawdown reflects the psychological/practical difficulty of holding through losses.",
                    options: [
                      { text: "It shows the true starting capital", isCorrect: false },
                      { text: "It captures the worst 'pain' an investor had to endure, affecting ability to stay invested", isCorrect: true },
                      { text: "It replaces the need for Alpha entirely", isCorrect: false },
                    ],
                  },
                ],
              },
            },
          ],
        },
      ];

      for (const courseData of standaloneCourses) {
        const course = await tx.academyCourse.upsert({
          where: { slug: courseData.slug },
          update: {
            title: courseData.title,
            description: courseData.description,
            level: courseData.level,
            status: "PUBLISHED",
            order: courseData.order,
          },
          create: {
            slug: courseData.slug,
            title: courseData.title,
            description: courseData.description,
            level: courseData.level,
            status: "PUBLISHED",
            order: courseData.order,
          },
        });

        for (const lessonData of courseData.lessons) {
          const lesson = await tx.academyLesson.upsert({
            where: { courseId_order: { courseId: course.id, order: lessonData.order } },
            update: {
              slug: lessonData.slug,
              title: lessonData.title,
              status: "PUBLISHED",
              content: lessonData.content,
            },
            create: {
              courseId: course.id,
              slug: lessonData.slug,
              title: lessonData.title,
              order: lessonData.order,
              status: "PUBLISHED",
              content: lessonData.content,
            },
          });

          // Flashcards
          for (let fIdx = 0; fIdx < lessonData.flashcards.length; fIdx++) {
            const card = lessonData.flashcards[fIdx];
            const cardOrder = fIdx + 1;
            await tx.academyFlashcard.upsert({
              where: { lessonId_order: { lessonId: lesson.id, order: cardOrder } },
              update: { front: card.front, back: card.back },
              create: { lessonId: lesson.id, order: cardOrder, front: card.front, back: card.back },
            });
          }

          // Quiz
          if (lessonData.quiz) {
            const quiz = await tx.academyQuiz.upsert({
              where: { lessonId_order: { lessonId: lesson.id, order: 1 } },
              update: {
                title: lessonData.quiz.title,
                description: lessonData.quiz.description,
                status: "PUBLISHED",
                passingScore: lessonData.quiz.passingScore,
              },
              create: {
                lessonId: lesson.id,
                order: 1,
                title: lessonData.quiz.title,
                description: lessonData.quiz.description,
                status: "PUBLISHED",
                passingScore: lessonData.quiz.passingScore,
              },
            });

            for (let qIdx = 0; qIdx < lessonData.quiz.questions.length; qIdx++) {
              const qItem = lessonData.quiz.questions[qIdx];
              const questionOrder = qIdx + 1;
              const question = await tx.academyQuizQuestion.upsert({
                where: { quizId_order: { quizId: quiz.id, order: questionOrder } },
                update: {
                  prompt: qItem.prompt,
                  explanation: qItem.explanation,
                  type: "SINGLE_CHOICE",
                },
                create: {
                  quizId: quiz.id,
                  order: questionOrder,
                  prompt: qItem.prompt,
                  explanation: qItem.explanation,
                  type: "SINGLE_CHOICE",
                },
              });

              for (let oIdx = 0; oIdx < qItem.options.length; oIdx++) {
                const optItem = qItem.options[oIdx];
                const optionOrder = oIdx + 1;
                await tx.academyQuizOption.upsert({
                  where: { questionId_order: { questionId: question.id, order: optionOrder } },
                  update: {
                    text: optItem.text,
                    isCorrect: optItem.isCorrect,
                  },
                  create: {
                    questionId: question.id,
                    order: optionOrder,
                    text: optItem.text,
                    isCorrect: optItem.isCorrect,
                  },
                });
              }
            }
          }
        }
      }

      console.log(`[SEED_DEV] Academy 6 standalone courses, ${standaloneCourses.reduce((acc, c) => acc + c.lessons.length, 0)} lessons, and quizzes successfully ensured.`);

      // 4. Simulation Engine: Scenario, Assets & Market Snapshots
      const scenario = await tx.simulationScenario.upsert({
        where: { key: "MVP_SCENARIO" },
        update: { name: "Standard Market Session", status: "ACTIVE" },
        create: { key: "MVP_SCENARIO", name: "Standard Market Session", status: "ACTIVE" },
      });

      const assetList = [
        { symbol: "AURA", name: "Aura Capital Inc.", order: 1, p1: "150.000000", p2: "152.500000", p3: "155.000000" },
        { symbol: "AAPL", name: "Apple Inc.", order: 2, p1: "220.000000", p2: "224.300000", p3: "228.000000" },
        { symbol: "MSFT", name: "Microsoft Corporation", order: 3, p1: "440.000000", p2: "448.200000", p3: "452.000000" },
        { symbol: "NVDA", name: "NVIDIA Corporation", order: 4, p1: "125.000000", p2: "128.900000", p3: "131.500000" },
      ];

      for (const assetSpec of assetList) {
        const asset = await tx.simulationAsset.upsert({
          where: { symbol: assetSpec.symbol },
          update: { name: assetSpec.name, displayOrder: assetSpec.order, status: "ACTIVE" },
          create: { symbol: assetSpec.symbol, name: assetSpec.name, displayOrder: assetSpec.order, status: "ACTIVE" },
        });

        const cycles = [
          { cycle: 1, price: assetSpec.p1 },
          { cycle: 2, price: assetSpec.p2 },
          { cycle: 3, price: assetSpec.p3 },
        ];

        for (const c of cycles) {
          await tx.simulationMarketSnapshot.upsert({
            where: { scenarioId_cycle_assetId: { scenarioId: scenario.id, cycle: c.cycle, assetId: asset.id } },
            update: { price: c.price, occurredAt: new Date() },
            create: { scenarioId: scenario.id, assetId: asset.id, cycle: c.cycle, price: c.price, occurredAt: new Date() },
          });
        }
      }

      console.log("[SEED_DEV] Simulation scenario, assets, and cycle snapshots ensured.");

      // 5. Community Discussions
      const alexId = createdUserMap.get("alex.demo2026@aura.internal");
      const dev1Id = createdUserMap.get("dev.user1@aura.internal");
      const dev2Id = createdUserMap.get("dev.user2@aura.internal");

      if (alexId && dev1Id && dev2Id) {
        const seedPosts = [
          {
            authorId: alexId,
            content: "# Market Volatility Analysis\n\nDiscussing risk management in volatile market cycles. In high volatility regimes, position sizing and risk discipline are critical to long-term compounding.",
          },
          {
            authorId: dev1Id,
            content: "Simulation Trading Order Execution Notes: Using limit orders during high volatility cycles helped preserve capital and avoid slippage in the technology scenario!",
          },
          {
            authorId: dev2Id,
            content: "When growth equities experience multiple expansion, value sectors often provide defensive rebalancing opportunities. Always track your risk-adjusted metrics.",
          },
        ];

        for (const postItem of seedPosts) {
          const existing = await tx.communityPost.findFirst({
            where: { authorId: postItem.authorId, content: postItem.content },
          });

          if (!existing) {
            await tx.communityPost.create({
              data: {
                authorId: postItem.authorId,
                content: postItem.content,
                status: "VISIBLE",
              },
            });
          }
        }
      }

      console.log("[SEED_DEV] Community discussions ensured.");
    });

    console.log("[SEED_DEV] SUCCESS: All development and demo seed data successfully populated.");
    process.exit(0);
  } catch (err: unknown) {
    console.error("[SEED_DEV] FAILED:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
