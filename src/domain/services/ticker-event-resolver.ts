import { STOCK_UNIVERSE, stockUniverseByTicker } from "@/domain/data/stock-universe";
import type { ExtractedEvent } from "@/domain/entities/extracted-event";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResolvedEventType =
  | "earnings"
  | "order_win"
  | "merger_acquisition"
  | "corporate_action"
  | "regulation"
  | "management_change"
  | "insider_activity"
  | "rating_change"
  | "ipo"
  | "other";

export type ResolvedEvent = {
  ticker: string;
  companyName: string;
  aliasFound: string;
  eventType: ExtractedEvent["eventType"];
  evidenceText: string;
  importantNumbers: string[];
  confidence: number;
};

// ─── Noise / Blacklist ────────────────────────────────────────────────────────

const NOISE_TERMS = new Set([
  "AM", "PM", "NOW", "LIVE", "VIEW", "BREAKING", "LATEST", "WATCH",
  "Q1", "Q2", "Q3", "Q4", "H1", "H2",
  "FY", "FY20", "FY21", "FY22", "FY23", "FY24", "FY25", "FY26", "FY27", "FY28",
  "EBITDA", "EBIT", "PAT", "EPS", "PE", "NAV", "NPL", "NPA",
  "ROE", "ROA", "ROCE", "MTM", "CAGR", "YOY", "QOQ", "MOM", "BPS",
  "USD", "INR", "EUR", "GBP", "JPY", "US", "USA",
  "CEO", "CFO", "MD", "COO", "CTO", "CMO",
  "NSE", "BSE", "RBI", "SEBI", "IRDAI", "TRAI",
  "IPO", "QIP", "FPO", "OFS", "ESOP", "AGM", "EGM",
  "CNBCTV18", "CNBC", "ET", "BS", "MC", "ET NOW",
  "CDMO", "DAM", "R32", "LOI", "MOU", "NOC",
  "THE", "AND", "FOR", "PER", "NOT", "BUT", "ARE", "ANY",
  "NEW", "OLD", "ALL", "BIG", "TOP", "KEY", "MAX", "MIN", "LTD", "PVT"
]);

// ─── Alias Map (built from stock universe) ────────────────────────────────────

// Maps every alias/companyName variation to the canonical ticker
const aliasMap = new Map<string, string>();

for (const entry of STOCK_UNIVERSE) {
  aliasMap.set(entry.ticker.toUpperCase(), entry.ticker);
  aliasMap.set(entry.companyName.toUpperCase(), entry.ticker);
  for (const alias of entry.aliases) {
    aliasMap.set(alias.toUpperCase(), entry.ticker);
  }
}

// ─── Event Classification Keywords ────────────────────────────────────────────

const EARNINGS_KW = /\b(result|results|revenue|ebitda|pat|eps|profit|loss|margin|guidance|quarterly|annual|q[1-4]\s+result|financial result|income|turnover|growth)\b/i;
const ORDER_KW = /\b(order win|contract|loa|letter of award|work order|purchase order|awarded|bagged|secured)\b/i;
const DEAL_KW = /\b(bulk deal|block deal|stake|acquisition|merger|buyout|takeover|open offer)\b/i;
const CORPORATE_ACTION_KW = /\b(dividend|bonus issue|stock split|buyback|rights issue|record date|ex-date|demerger)\b/i;
const REGULATORY_KW = /\b(approval|penalty|fine|investigation|notice|order|license|clearance|sebi|rbi|irdai|ban|suspension)\b/i;
const MANAGEMENT_KW = /\b(resign|resignation|appoint|appointment|ceo|cfo|md|director|board|chairman|elevated|steps down)\b/i;
const INSIDER_KW = /\b(promoter|insider|pledge|unpledge|stake sale|bulk sale|open market|creeping acquisition)\b/i;
const RATING_KW = /\b(upgrade|downgrade|rating|target price|buy|sell|hold|outperform|underperform|initiate)\b/i;
const IPO_KW = /\b(ipo|initial public offering|listing|gmp|grey market|issue price|allotment)\b/i;

// ─── Evidence (financial numbers) ────────────────────────────────────────────

const EVIDENCE_PATTERN = /₹[\d,]+\s*(cr|crore|lakh|bn|billion|mn|million)?|\d+\.?\d*\s*(cr|crore|%|bps|basis points|lakh|billion|million)/gi;
const FINANCIAL_EVIDENCE_KW = /\b(revenue|profit|margin|turnover|ebitda|pat|eps|order book|contract value|deal value)\b/i;

// ─── Company Resolution ───────────────────────────────────────────────────────

/**
 * Scans text for any known company name, ticker, or alias.
 * Returns the canonical ticker and the alias that was matched.
 */
export function resolveCompanyFromText(text: string): { ticker: string; aliasFound: string } | null {
  const upperText = ` ${text.toUpperCase()} `;

  // Sort by length descending so longer matches (e.g., "BAJAJ AUTO") win over shorter ones ("BAJAJ")
  const candidates = Array.from(aliasMap.entries()).sort(([a], [b]) => b.length - a.length);

  for (const [alias, ticker] of candidates) {
    if (alias.length < 2) continue;
    if (NOISE_TERMS.has(alias)) continue;

    // Word-boundary aware match
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(^|[^A-Z0-9])(${escaped})([^A-Z0-9]|$)`);
    if (pattern.test(upperText)) {
      return { ticker, aliasFound: alias };
    }
  }

  return null;
}

/**
 * Resolves a known ticker hint directly.
 * Returns null if it's a noise/blacklist term.
 */
export function resolveTickerHint(hint: string): string | null {
  const norm = hint.trim().toUpperCase();
  if (NOISE_TERMS.has(norm)) return null;
  if (aliasMap.has(norm)) return aliasMap.get(norm)!;
  return null;
}

// ─── Event Classification ─────────────────────────────────────────────────────

function classifyEventFromText(text: string): ExtractedEvent["eventType"] | null {
  if (EARNINGS_KW.test(text)) return "earnings";
  if (ORDER_KW.test(text)) return "order_win";
  if (DEAL_KW.test(text)) return "merger_acquisition";
  if (CORPORATE_ACTION_KW.test(text)) return "insider_activity"; // maps to closest domain type
  if (REGULATORY_KW.test(text)) return "regulation";
  if (MANAGEMENT_KW.test(text)) return "management_change";
  if (INSIDER_KW.test(text)) return "insider_activity";
  if (RATING_KW.test(text)) return "rating_change";
  if (IPO_KW.test(text)) return "ipo";
  return null;
}

// ─── Evidence Extraction ──────────────────────────────────────────────────────

function extractImportantNumbers(text: string): string[] {
  const matches = text.match(EVIDENCE_PATTERN) ?? [];
  return [...new Set(matches.map((m) => m.trim()))].slice(0, 5);
}

function hasFinancialEvidence(text: string, isOfficialFiling: boolean): boolean {
  if (isOfficialFiling) return true;
  const hasNumbers = EVIDENCE_PATTERN.test(text);
  EVIDENCE_PATTERN.lastIndex = 0; // reset regex state
  return hasNumbers || FINANCIAL_EVIDENCE_KW.test(text);
}

// ─── Main Resolver ────────────────────────────────────────────────────────────

export type TickerEventInput = {
  title: string;
  content: string;
  tickersHint: string[];
  sourceKind: string;
  sourceName: string;
};

/**
 * Analyst-grade ticker + event resolver.
 *
 * Returns a ResolvedEvent only when BOTH:
 *  1. A real listed company is identified
 *  2. A meaningful market event is present with financial evidence
 *
 * Returns null when no valid signal can be formed.
 */
export function resolveTickerEvent(input: TickerEventInput): ResolvedEvent | null {
  const { title, content, tickersHint, sourceKind, sourceName } = input;
  const fullText = `${title} ${content}`;
  const isOfficialFiling = sourceKind === "filing";

  // ── Step 1: Resolve company ──────────────────────────────────────────────
  let resolved: { ticker: string; aliasFound: string } | null = null;

  // First try explicit ticker hints (highest confidence — direct from NSE/BSE)
  for (const hint of tickersHint) {
    const ticker = resolveTickerHint(hint);
    if (ticker) {
      resolved = { ticker, aliasFound: hint };
      console.log(`[ticker-event] resolved ${hint} -> ${ticker}`);
      break;
    } else if (NOISE_TERMS.has(hint.toUpperCase())) {
      console.log(`[ticker-event] skipped ${hint}: financial term, not company`);
    } else {
      console.log(`[ticker-event] skipped ${hint}: not in stock universe`);
    }
  }

  // Fallback: scan full text for company name/alias
  if (!resolved) {
    resolved = resolveCompanyFromText(fullText);
    if (resolved) {
      console.log(`[ticker-event] resolved alias "${resolved.aliasFound}" -> ${resolved.ticker} from text`);
    }
  }

  if (!resolved) {
    console.log(`[ticker-event] skipped document: no valid company resolved`);
    return null;
  }

  // ── Step 2: Classify event ───────────────────────────────────────────────
  const eventType = classifyEventFromText(fullText);

  if (!eventType && !isOfficialFiling) {
    console.log(`[ticker-event] skipped document: no event keyword found for ${resolved.ticker}`);
    return null;
  }

  const finalEventType = eventType ?? "other";

  // ── Step 3: Evidence gate ────────────────────────────────────────────────
  const importantNumbers = extractImportantNumbers(fullText);
  const hasFinancialNums = hasFinancialEvidence(fullText, isOfficialFiling);
  
  // Require at least one of: official filing OR financial numbers OR event keyword
  const hasEvidence = isOfficialFiling || hasFinancialNums || eventType !== null;

  if (!hasEvidence) {
    console.log(`[ticker-event] skipped document: no evidence for ${resolved.ticker}`);
    return null;
  }

  // ── Step 4: Confidence scoring ───────────────────────────────────────────
  let confidence = 0.5;
  if (isOfficialFiling) confidence += 0.35;
  if (importantNumbers.length > 0) confidence += 0.1;
  if (tickersHint.some((h) => h.toUpperCase() === resolved!.ticker)) confidence += 0.1;
  if (eventType !== null) confidence += 0.1;
  confidence = Math.min(confidence, 1.0);

  if (confidence < 0.6) {
    console.log(`[ticker-event] skipped ${resolved.ticker}: confidence too low (${confidence.toFixed(2)})`);
    return null;
  }

  const universeEntry = stockUniverseByTicker.get(resolved.ticker);

  const result: ResolvedEvent = {
    ticker: resolved.ticker,
    companyName: universeEntry?.companyName ?? resolved.ticker,
    aliasFound: resolved.aliasFound,
    eventType: finalEventType,
    evidenceText: `${title.slice(0, 120)} ${importantNumbers.join(" ")}`.trim(),
    importantNumbers,
    confidence
  };

  console.log(`[ticker-event] created ${finalEventType.toUpperCase()} event for ${resolved.ticker} (confidence: ${confidence.toFixed(2)})`);
  return result;
}
