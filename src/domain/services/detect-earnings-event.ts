import type { EarningsEvent, EarningsSource, FiscalQuarter } from "@/domain/entities/earnings-event";
import type { RawDocument } from "@/domain/entities/raw-document";

const earningsKeywords = [
  "results",
  "financial results",
  "quarterly results",
  "earnings",
  "q1",
  "q2",
  "q3",
  "q4"
];

function detectQuarter(text: string): FiscalQuarter | null {
  if (/\bq1\b|quarter\s*1|first quarter/i.test(text)) return "Q1";
  if (/\bq2\b|quarter\s*2|second quarter/i.test(text)) return "Q2";
  if (/\bq3\b|quarter\s*3|third quarter/i.test(text)) return "Q3";
  if (/\bq4\b|quarter\s*4|fourth quarter/i.test(text)) return "Q4";
  return null;
}

function detectFiscalYear(text: string, earningsDate: string) {
  const explicitYear = text.match(/\b(?:fy|fiscal year)\s*(20\d{2})\b/i)?.[1];
  if (explicitYear) {
    return Number(explicitYear);
  }

  return new Date(earningsDate).getUTCFullYear();
}

function detectSource(sourceName: string): EarningsSource | null {
  if (sourceName === "NSE Filing") return "NSE";
  if (sourceName === "BSE Announcement") return "BSE";
  return null;
}

export function detectEarningsEvent(document: RawDocument): Omit<EarningsEvent, "estimatedEPS" | "actualEPS" | "epsSurprisePercent" | "estimatedRevenue" | "actualRevenue" | "revenueSurprisePercent" | "hasGuidance" | "guidanceTone" | "createdAt" | "id"> | null {
  if (document.sourceKind !== "filing") {
    return null;
  }

  const text = `${document.title} ${document.content}`.toLowerCase();
  const hasKeyword =
    earningsKeywords.some((keyword) => text.includes(keyword)) ||
    document.metadata.category === "results" ||
    document.metadata.announcementType === "results";

  if (!hasKeyword) {
    return null;
  }

  const fiscalQuarter = detectQuarter(text);
  const source = detectSource(document.sourceName);
  const ticker = document.tickersHint[0] ?? String(document.metadata.ticker ?? "").toUpperCase();

  if (!ticker || !fiscalQuarter || !source) {
    return null;
  }

  return {
    ticker,
    companyName: String(document.metadata.companyName ?? ticker),
    earningsDate: document.publishedAt,
    fiscalQuarter,
    fiscalYear: detectFiscalYear(text, document.publishedAt),
    source,
    sourceUrl: document.pdfUrl ?? document.url,
    operatingProfit: null,
    operatingMargin: null,
    netProfit: null
  };
}
