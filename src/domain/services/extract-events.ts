import type { ExtractedEvent } from "@/domain/entities/extracted-event";
import type { NormalizedDocument } from "@/domain/entities/normalized-document";
import type { RawDocument } from "@/domain/entities/raw-document";

const companyRegistry: Record<
  string,
  { company: string; sector: string }
> = {
  RELIANCE: { company: "Reliance Industries", sector: "Energy" },
  INFY: { company: "Infosys", sector: "IT" },
  HDFCBANK: { company: "HDFC Bank", sector: "Financials" },
  TATAMOTORS: { company: "Tata Motors", sector: "Auto" }
};

function detectEventType(text: string): ExtractedEvent["eventType"] {
  if (/order|contract|partnership/.test(text)) return "order_win";
  if (/promoter|insider|stake/.test(text)) return "insider_activity";
  if (/ceo|cfo|management/.test(text)) return "management_change";
  if (/volume|delivery|breakout|breakdown/.test(text)) return "unusual_volume";
  if (/social|buzz|mentions/.test(text)) return "sentiment_spike";
  if (/earnings|results|revenue|profit/.test(text)) return "earnings";
  return "other";
}

function detectSentiment(text: string): ExtractedEvent["sentiment"] {
  const positive = /growth|strong|upbeat|win|expansion|buying|breakout/.test(text);
  const negative = /selling|cut|probe|risk|weak|breakdown|concern/.test(text);

  if (positive && negative) return "mixed";
  if (positive) return "positive";
  if (negative) return "negative";
  return "neutral";
}

export function extractEvents(
  rawDocuments: RawDocument[],
  normalizedDocuments: NormalizedDocument[]
) {
  return normalizedDocuments
    .filter((document) => !document.isDuplicate)
    .flatMap<ExtractedEvent>((document) => {
      const raw = rawDocuments.find((item) => item.id === document.rawDocumentId);

      if (!raw) {
        return [];
      }

      return raw.tickersHint.map((ticker) => {
        const company = companyRegistry[ticker] ?? {
          company: ticker,
          sector: "Unknown"
        };
        const sourceConfidence =
          raw.sourceKind === "filing"
            ? 0.95
            : raw.sourceKind === "news"
              ? 0.82
              : raw.sourceKind === "market_data"
                ? 0.78
                : 0.64;
        const sentiment = detectSentiment(document.canonicalContent);

        return {
          id: `evt_${raw.id}_${ticker}`,
          documentId: raw.id,
          ticker,
          company: company.company,
          sector: company.sector,
          eventType: detectEventType(document.canonicalContent),
          sentiment,
          confidence: sourceConfidence,
          eventAt: raw.publishedAt,
          keywords: raw.title.toLowerCase().split(/\W+/).filter(Boolean).slice(0, 6),
          evidence: [raw.title, raw.content.slice(0, 160)],
          sourceName: raw.sourceName,
          sourceKind: raw.sourceKind
        };
      });
    });
}
