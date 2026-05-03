import { createId } from "@paralleldrive/cuid2";
import type { EngineSignal } from "@/domain/entities/engine-signal";
import type { InsightCard, InsightCardType } from "@/domain/entities/insight-card";

// ─── Card-type mapping ────────────────────────────────────────────────────────
// Uses string-include checks so it works against both the domain eventType
// strings AND any future aliases without a brittle switch statement.
export function mapCardType(eventType: string): InsightCardType {
  const et = eventType.toLowerCase();

  if (et.includes("earn") || et.includes("result") || et.includes("eps")) return "EARNINGS";
  if (et.includes("order") || et.includes("contract")) return "ORDER";
  if (et.includes("deal") || et.includes("bulk") || et.includes("block")) return "DEAL";
  if (
    et.includes("dividend") ||
    et.includes("bonus") ||
    et.includes("split") ||
    et.includes("buyback") ||
    et.includes("rights")
  )
    return "CORPORATE_ACTION";
  if (
    et.includes("insider") ||
    et.includes("volume") ||
    et.includes("merger") ||
    et.includes("acquisition") ||
    et.includes("ipo") ||
    et.includes("regulation") ||
    et.includes("litigation") ||
    et.includes("rating") ||
    et.includes("management")
  )
    return "ANNOUNCEMENT";

  return "NEWS";
}

// ─── Headline generation ──────────────────────────────────────────────────────
// Produces short, user-facing headlines that read like a financial news ticker.
export function buildHeadline(signal: EngineSignal): string {
  const company = signal.company || signal.ticker;
  const et = signal.eventType.toLowerCase();

  if (et.includes("earn") || et.includes("result") || et.includes("eps")) {
    const tone = signal.sentiment === "positive" ? "beats estimates" : signal.sentiment === "negative" ? "misses estimates" : "reports earnings update";
    return `${company} ${tone}`;
  }
  if (et.includes("order") || et.includes("contract")) {
    return `${company} wins new order`;
  }
  if (et.includes("bulk") || et.includes("block") || et.includes("deal")) {
    return `Large deal activity in ${company}`;
  }
  if (et.includes("dividend")) {
    return `${company} announces dividend`;
  }
  if (et.includes("bonus")) {
    return `${company} announces bonus issue`;
  }
  if (et.includes("split")) {
    return `${company} announces stock split`;
  }
  if (et.includes("buyback")) {
    return `${company} initiates buyback`;
  }
  if (et.includes("merger") || et.includes("acquisition")) {
    return `${company} in M&A activity`;
  }
  if (et.includes("insider") || et.includes("promoter")) {
    return `Insider activity detected in ${company}`;
  }
  if (et.includes("volume")) {
    return `Unusual volume spike in ${company}`;
  }
  if (et.includes("ipo") || et.includes("listing")) {
    return `${company} IPO / listing event`;
  }
  if (et.includes("management")) {
    return `Leadership change at ${company}`;
  }
  if (et.includes("regulation") || et.includes("sebi") || et.includes("rbi")) {
    return `Regulatory development at ${company}`;
  }
  if (et.includes("rating")) {
    return `Rating action on ${company}`;
  }
  if (et.includes("litigation")) {
    return `Legal development at ${company}`;
  }

  return `${company} sees market-moving event`;
}

// ─── Rating: 1–5 stars from impactScore ──────────────────────────────────────
function deriveRating(impactScore: number): number {
  // impactScore is already the pre-market-multiplied 0–100 score from scoreSignal
  const raw = Math.ceil((impactScore / 100) * 5);
  return Math.max(1, Math.min(5, raw));
}

// ─── Main builder ─────────────────────────────────────────────────────────────
// Pure function — no async, no DB, no framework coupling.
// The use-case layer is responsible for DB lookups and Gemma enrichment.
export function buildInsightCard(
  signal: EngineSignal,
  overrides?: Partial<Pick<InsightCard, "cardType" | "headline" | "summary" | "source" | "sourceUrl" | "pdfUrl" | "publishedAt">>
): InsightCard {
  // impactScore: use signal.impactScore (pre-multiplier score from scoreSignal)
  // This is the bounded 0–100 adjustedScore before market multiplier is applied.
  const impactScore = signal.impactScore;

  const cardType = overrides?.cardType ?? mapCardType(signal.eventType);
  const headline = overrides?.headline ?? buildHeadline(signal);

  // Summary: join explanation reasons into a readable paragraph.
  const defaultSummary = signal.explanation.reasons.join(". ").replace(/\.\./g, ".").trim();
  const summary = overrides?.summary ?? (defaultSummary || `${signal.company} has a market-moving signal with ${signal.sentiment} sentiment.`);

  const source = overrides?.source ?? (signal.sources[0] ?? "NSE");
  const sourceUrl = overrides?.sourceUrl ?? (signal.sourceUrls[0] ?? null);
  const pdfUrl = overrides?.pdfUrl ?? (signal.pdfUrls[0] ?? null);
  const publishedAt = overrides?.publishedAt ?? new Date();

  return {
    id: createId(),
    signalId: signal.id,
    ticker: signal.ticker,
    companyName: signal.company,
    cardType,
    headline,
    summary,
    sentiment: signal.sentiment,
    confidence: signal.confidence,
    rating: deriveRating(impactScore),
    impactScore,
    source,
    sourceUrl,
    pdfUrl,
    publishedAt,
    createdAt: new Date()
  };
}
