import { stockUniverseByTicker } from "@/domain/data/stock-universe";

// ─── Blacklist ─────────────────────────────────────────────────────────────────
// Common financial abbreviations that are NOT stock tickers.
export const TICKER_BLACKLIST = new Set([
  // Time
  "AM", "PM",
  // Quarters / fiscal years
  "Q1", "Q2", "Q3", "Q4",
  "FY", "FY20", "FY21", "FY22", "FY23", "FY24", "FY25", "FY26", "FY27", "FY28",
  // Metrics
  "EBITDA", "EBIT", "PAT", "EPS", "PE", "NAV", "AUM", "NPA", "NPL",
  "ROE", "ROA", "ROCE", "IRR", "NPM", "OPM",
  // Growth terms
  "YOY", "QOQ", "CAGR", "MOM",
  // Currencies / regions
  "US", "USA", "USD", "INR", "EUR", "GBP", "JPY",
  // Roles
  "CEO", "CFO", "MD", "COO", "CTO", "CMO", "CRO",
  // Regulators / exchanges
  "NSE", "BSE", "RBI", "SEBI", "IRDAI", "TRAI",
  // Corporate actions
  "IPO", "QIP", "FPO", "OFS", "ESOP", "AGM", "EGM",
  // Misc noise
  "DAM", "CDMO", "R32", "MOU", "LOI", "NOC",
  "THE", "AND", "FOR", "PER", "NOT", "BUT", "ARE", "ANY",
  "NEW", "OLD", "ALL", "BIG", "TOP", "KEY", "MAX", "MIN"
]);

// ─── Normalize ────────────────────────────────────────────────────────────────

/**
 * Normalizes a raw string to a potential ticker format.
 * Trims, uppercases, removes anything that isn't A-Z, 0-9, or hyphen.
 */
export function normalizeTicker(value: string): string {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

// ─── Validate ────────────────────────────────────────────────────────────────

/**
 * Returns true only if the ticker:
 * 1. Is not empty after normalization
 * 2. Is not in the financial-word blacklist
 * 3. Exists in the official NSE/BSE stock universe
 */
export function isValidTicker(value: string): boolean {
  const ticker = normalizeTicker(value);

  if (!ticker || ticker.length < 2) return false;
  if (TICKER_BLACKLIST.has(ticker)) return false;
  if (!stockUniverseByTicker.has(ticker)) {
    console.log(`[ticker-validator] skipped invalid ticker: ${ticker}`);
    return false;
  }

  return true;
}

/**
 * Filters a list of candidates down to only verified NSE/BSE tickers.
 * Deduplicates the result.
 */
export function filterValidTickers(candidates: string[]): string[] {
  return [...new Set(
    candidates
      .map(normalizeTicker)
      .filter(isValidTicker)
  )];
}
