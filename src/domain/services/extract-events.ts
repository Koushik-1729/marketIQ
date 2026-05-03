import type { ExtractedEvent } from "@/domain/entities/extracted-event";
import type { NormalizedDocument } from "@/domain/entities/normalized-document";
import type { RawDocument } from "@/domain/entities/raw-document";
import { resolveTickers, resolveTickersFromText } from "@/domain/services/ticker-resolver";
import { detectEvent } from "@/domain/services/event-detector";

export function extractEvents(
  rawDocuments: RawDocument[],
  normalizedDocuments: NormalizedDocument[]
): ExtractedEvent[] {
  return normalizedDocuments
    .filter((document) => !document.isDuplicate)
    .flatMap<ExtractedEvent>((document) => {
      const raw = rawDocuments.find((item) => item.id === document.rawDocumentId);
      if (!raw) return [];

      const fullText = `${raw.title} ${raw.content}`;
      
      // 1. Resolve tickers from full text (handles multi-word aliases)
      const resolvedFromText = resolveTickersFromText(fullText);
      
      // 2. Also check single-token candidates as backup or for specific ticker hints
      const tokens = fullText.match(/\b[A-Z][A-Z0-9&.-]{1,14}\b/g) ?? [];
      const resolvedFromTokens = resolveTickers(tokens);

      // Merge results
      const seen = new Set(resolvedFromText.map(r => r.ticker));
      const resolvedTickers = [...resolvedFromText];
      
      for (const r of resolvedFromTokens) {
        if (!seen.has(r.ticker)) {
          resolvedTickers.push(r);
          seen.add(r.ticker);
        }
      }

      if (resolvedTickers.length === 0) {
        console.log(`[pipeline] skipped document: no valid company resolved for "${raw.title}"`);
        return [];
      }

      const events: ExtractedEvent[] = [];

      for (const resolved of resolvedTickers) {
        // 3. Detect eventType
        const eventType = detectEvent(fullText);
        
        if (!eventType) {
          console.log(`[pipeline] skipped: no financial event detected for ${resolved.ticker}`);
          continue;
        }

        // 4. Evidence Gate
        const hasNumbers = /[₹$]|\d+\.?\d*\s*(cr|crore|%|bps|lakh|bn|mn)/gi.test(fullText);
        const isOfficial = raw.sourceKind === "filing";
        const strongMatch = fullText.toLowerCase().includes(resolved.companyName.toLowerCase());

        if (!isOfficial && !hasNumbers && !strongMatch) {
          console.log(`[pipeline] skipped: insufficient evidence for ${resolved.ticker}`);
          continue;
        }

        // 5. Confidence Scoring
        let confidence = 0.5;
        if (isOfficial) confidence += 0.2;
        if (hasNumbers) confidence += 0.15;
        if (strongMatch) confidence += 0.15;
        confidence = Math.min(confidence, 1.0);

        if (confidence < 0.6) {
          console.log(`[pipeline] skipped ${resolved.ticker}: confidence too low (${confidence})`);
          continue;
        }

        console.log(`[event] detected ${eventType} for ${resolved.ticker} (confidence: ${confidence})`);

        events.push({
          id: `evt_${raw.id}_${resolved.ticker}`,
          documentId: raw.id,
          ticker: resolved.ticker,
          company: resolved.companyName,
          sector: "Other", 
          eventType: eventType.toLowerCase() as any,
          sentiment: detectSentiment(fullText),
          confidence,
          eventAt: raw.publishedAt,
          keywords: [eventType, ...resolved.ticker.split("-")],
          evidence: [raw.title, fullText.slice(0, 200)],
          sourceName: raw.sourceName,
          sourceKind: raw.sourceKind,
          sourceUrl: raw.pdfUrl ?? raw.url,
          pdfUrl: raw.pdfUrl
        });
      }

      return events;
    });
}

function detectSentiment(text: string): ExtractedEvent["sentiment"] {
  const positive =
    /growth|strong|upbeat|win|expansion|buying|breakout|beats?|exceed|upgrade|record|robust|positive|surge/i.test(text);
  const negative =
    /selling|cut|probe|risk|weak|breakdown|concern|miss|disappoint|downgrade|penalty|loss|decline|fall/i.test(text);

  if (positive && negative) return "mixed";
  if (positive) return "positive";
  if (negative) return "negative";
  return "neutral";
}
