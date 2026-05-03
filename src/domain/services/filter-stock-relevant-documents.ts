import { STOCK_UNIVERSE, stockUniverseByTicker } from "@/domain/data/stock-universe";
import type { RawDocument } from "@/domain/entities/raw-document";

const financialKeywords = [
  "results",
  "earnings",
  "revenue",
  "profit",
  "margin",
  "dividend",
  "bonus",
  "split",
  "rights issue",
  "merger",
  "acquisition",
  "demerger",
  "board meeting",
  "promoter",
  "stake",
  "insider",
  "bulk deal",
  "block deal",
  "order win",
  "contract",
  "capex",
  "guidance",
  "rating",
  "upgrade",
  "downgrade",
  "buyback",
  "ipo",
  "listing",
  "gmp",
  "sebi",
  "rbi",
  "penalty",
  "investigation",
  "management change",
  "ceo",
  "cfo",
  "resignation",
  "policy",
  "regulation",
  "volume",
  "breakout",
  "breakdown",
  "announcement",
  "filing",
  "sector"
];

const highImpactCategories = new Set([
  "results",
  "dividend",
  "acquisition",
  "buyback",
  "promoter_activity",
  "board",
  "board_meeting",
  "board_outcome",
  "shareholding",
  "allotment",
  "m&a",
  "general_announcement"
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsToken(text: string, token: string) {
  const normalizedToken = token.trim().toLowerCase();

  if (!normalizedToken) {
    return false;
  }

  if (normalizedToken.includes(" ")) {
    return text.includes(normalizedToken);
  }

  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedToken)}([^a-z0-9]|$)`);
  return pattern.test(text);
}

function isFreshDocument(document: RawDocument) {
  const publishedAt = new Date(document.publishedAt).getTime();
  const ageHours = (Date.now() - publishedAt) / (1000 * 60 * 60);
  return Number.isFinite(ageHours) ? ageHours <= 72 : true;
}

function hasStructuredHighImpactMetadata(document: RawDocument) {
  const category = String(document.metadata.category ?? "").toLowerCase();
  const announcementType = String(document.metadata.announcementType ?? "").toLowerCase();

  return highImpactCategories.has(category) || highImpactCategories.has(announcementType);
}

function hasSocialMomentum(document: RawDocument) {
  if (document.sourceKind !== "social") {
    return false;
  }

  const mentionSpike = Number(document.metadata.mentionCountSpike ?? 0);
  const trendingScore = Number(document.metadata.trendingScore ?? 0);
  const sentiment = String(document.metadata.sentiment ?? "").toLowerCase();

  return mentionSpike >= 1.5 && trendingScore >= 50 && sentiment !== "negative";
}

function allowStocktwitsMomentumOnly(document: RawDocument) {
  if (document.sourceName !== "Stocktwits") {
    return false;
  }

  return (
    document.tickersHint.length > 0 &&
    isFreshDocument(document) &&
    (hasSocialMomentum(document) || document.metadata.sourceType === "social_momentum")
  );
}

export type StockRelevantFilterResult = {
  kept: RawDocument[];
  filteredOut: RawDocument[];
};

export function filterStockRelevantDocuments(
  documents: RawDocument[]
): StockRelevantFilterResult {
  const kept: RawDocument[] = [];
  const filteredOut: RawDocument[] = [];

  for (const document of documents) {
    const text = `${document.title} ${document.content}`.toLowerCase();
    const stocktwitsMomentumOnly = allowStocktwitsMomentumOnly(document);
    const matchedUniverse = STOCK_UNIVERSE.find((entry) => {
      if (document.tickersHint.includes(entry.ticker)) {
        return true;
      }

      return [entry.ticker, entry.companyName, ...entry.aliases].some((token) =>
        containsToken(text, token)
      );
    });

    const hasFinancialKeyword = financialKeywords.some((keyword) =>
      text.includes(keyword)
    );
    const hasAllowedEventType =
      hasFinancialKeyword ||
      hasStructuredHighImpactMetadata(document) ||
      hasSocialMomentum(document);

    if (!isFreshDocument(document)) {
      filteredOut.push(document);
      continue;
    }

    if (!matchedUniverse && !stocktwitsMomentumOnly) {
      filteredOut.push(document);
      continue;
    }

    if (!hasAllowedEventType && !stocktwitsMomentumOnly) {
      filteredOut.push(document);
      continue;
    }

    const canonicalTicker =
      document.tickersHint.find((ticker) => stockUniverseByTicker.has(ticker)) ??
      matchedUniverse?.ticker ??
      document.tickersHint[0];

    kept.push({
      ...document,
      tickersHint: Array.from(new Set([canonicalTicker, ...document.tickersHint])),
      metadata: {
        ...document.metadata,
        matchedCompany: matchedUniverse?.companyName ?? null,
        matchedSector: matchedUniverse?.sector ?? null,
        relevanceReason: stocktwitsMomentumOnly
          ? "stocktwits-fresh-ticker-momentum-match"
          : document.sourceKind === "social"
            ? "stock-universe-and-social-momentum-match"
            : "stock-universe-and-financial-event-match"
      }
    });
  }

  return {
    kept,
    filteredOut
  };
}
