import { STOCK_UNIVERSE } from "@/domain/data/stock-universe";

const BLACKLIST = new Set([
  "AM","PM",
  "Q1","Q2","Q3","Q4",
  "FY20","FY21","FY22","FY23","FY24","FY25","FY26","FY27",
  "EBITDA","EBIT","PAT","EPS",
  "YOY","QOQ",
  "MTM","CDMO","R32",
  "NOW","LIVE","VIEW",
  "CNBCTV18",
  "USD","INR","US",
  "CEO","CFO","MD",
  "NSE","BSE","SEBI","RBI"
]);

export type ResolvedTicker = {
  ticker: string;
  companyName: string;
  aliasFound?: string;
};

export function normalizeText(value: string): string {
  return value
    .toUpperCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^A-Z0-9-]/g, " ");
}

export function resolveTicker(candidate: string): ResolvedTicker | null {
  const norm = normalizeText(candidate);
  if (BLACKLIST.has(norm)) {
    console.log(`[ticker] skipped ${norm} (blacklist)`);
    return null;
  }

  // Iterate STOCK_UNIVERSE to match aliases
  for (const entry of STOCK_UNIVERSE) {
    // Direct ticker match
    if (entry.ticker === norm) return { ticker: entry.ticker, companyName: entry.companyName, aliasFound: entry.ticker };
    
    // Alias match
    for (const alias of entry.aliases) {
      if (normalizeText(alias) === norm) {
        console.log(`[ticker] resolved ${candidate} -> ${entry.ticker}`);
        return { ticker: entry.ticker, companyName: entry.companyName, aliasFound: alias };
      }
    }
  }

  return null;
}

export function resolveTickers(candidates: string[]): ResolvedTicker[] {
  const resolved: ResolvedTicker[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    const res = resolveTicker(candidate);
    if (res && !seen.has(res.ticker)) {
      resolved.push(res);
      seen.add(res.ticker);
    }
  }

  return resolved;
}

export function resolveTickersFromText(text: string): ResolvedTicker[] {
  const normalized = normalizeText(text);
  const resolved: ResolvedTicker[] = [];
  const seen = new Set<string>();

  // Sort STOCK_UNIVERSE by longest alias length first to avoid sub-phrase match issues
  const sortedUniverse = [...STOCK_UNIVERSE].sort((a, b) => {
    const maxA = Math.max(...a.aliases.map(al => al.length), a.ticker.length);
    const maxB = Math.max(...b.aliases.map(al => al.length), b.ticker.length);
    return maxB - maxA;
  });

  for (const entry of sortedUniverse) {
    const aliases = [entry.ticker, ...entry.aliases];
    for (const alias of aliases) {
      const normAlias = normalizeText(alias);
      if (normAlias.length < 2) continue;
      if (BLACKLIST.has(normAlias)) continue;

      // Word boundaries for exact phrase match
      const escaped = normAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i");

      if (pattern.test(normalized)) {
        if (!seen.has(entry.ticker)) {
          console.log(`[ticker] resolved from text: "${alias}" -> ${entry.ticker}`);
          resolved.push({
            ticker: entry.ticker,
            companyName: entry.companyName,
            aliasFound: alias
          });
          seen.add(entry.ticker);
          break; // move to next stock entry
        }
      }
    }
  }

  return resolved;
}
