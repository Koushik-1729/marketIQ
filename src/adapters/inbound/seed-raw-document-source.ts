import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";
import { simpleHash } from "@/lib/hash";

export class SeedRawDocumentSourceAdapter implements RawDocumentSourcePort {
  async fetchLatest(): Promise<RawDocument[]> {
    return [
      {
        id: "doc_1",
        sourceName: "Reuters Markets",
        sourceKind: "news" as const,
        sourceReliabilityScore: 9,
        urlHash: simpleHash("https://example.com/reliance-partnership"),
        publishedAt: "2026-04-26T07:42:00+05:30",
        fetchedAt: "2026-04-26T07:44:00+05:30",
        title: "Reliance expands partnership pipeline as retail and telecom capex picks up",
        url: "https://example.com/reliance-partnership",
        content:
          "Reliance expansion, growth momentum, and strong partnership updates supported a breakout narrative with broad media confirmation.",
        tickersHint: ["RELIANCE"],
        rawPayload:
          "Reliance expansion, growth momentum, and strong partnership updates supported a breakout narrative with broad media confirmation.",
        rawPayloadFormat: "text",
        metadata: {}
      },
      {
        id: "doc_2",
        sourceName: "NSE Filing",
        sourceKind: "filing" as const,
        sourceReliabilityScore: 10,
        urlHash: simpleHash("https://example.com/hdfcbank-filing"),
        publishedAt: "2026-04-26T07:30:00+05:30",
        fetchedAt: "2026-04-26T07:31:00+05:30",
        title: "HDFC Bank disclosure highlights promoter-related transaction update",
        url: "https://example.com/hdfcbank-filing",
        content:
          "Promoter transaction disclosure and elevated delivery activity raised concern around near-term positioning.",
        tickersHint: ["HDFCBANK"],
        rawPayload:
          "Promoter transaction disclosure and elevated delivery activity raised concern around near-term positioning.",
        rawPayloadFormat: "text",
        metadata: {}
      },
      {
        id: "doc_3",
        sourceName: "Business Standard",
        sourceKind: "news" as const,
        sourceReliabilityScore: 8,
        urlHash: simpleHash("https://example.com/infosys-management"),
        publishedAt: "2026-04-26T07:55:00+05:30",
        fetchedAt: "2026-04-26T07:56:00+05:30",
        title: "Infosys management reshuffle keeps street watchful despite steady demand outlook",
        url: "https://example.com/infosys-management",
        content:
          "Management change produced a mixed read as steady demand commentary met leadership transition questions.",
        tickersHint: ["INFY"],
        rawPayload:
          "Management change produced a mixed read as steady demand commentary met leadership transition questions.",
        rawPayloadFormat: "text",
        metadata: {}
      },
      {
        id: "doc_4",
        sourceName: "Stocktwits",
        sourceKind: "social" as const,
        sourceReliabilityScore: 4,
        urlHash: simpleHash("https://example.com/tatamotors-buzz"),
        publishedAt: "2026-04-26T08:02:00+05:30",
        fetchedAt: "2026-04-26T08:03:00+05:30",
        title: "Tata Motors sees sharp rise in mentions as traders discuss volume breakout setup",
        url: "https://example.com/tatamotors-buzz",
        content:
          "Social buzz, rising mentions, and volume chatter pushed Tata Motors into a high-attention conversation.",
        tickersHint: ["TATAMOTORS"],
        rawPayload:
          "Social buzz, rising mentions, and volume chatter pushed Tata Motors into a high-attention conversation.",
        rawPayloadFormat: "text",
        metadata: {
          sentiment: "positive",
          mentionCountSpike: 2.1,
          trendingScore: 74
        }
      },
      {
        id: "doc_5",
        sourceName: "Moneycontrol",
        sourceKind: "news" as const,
        sourceReliabilityScore: 7,
        urlHash: simpleHash("https://example.com/reliance-partnership-duplicate"),
        publishedAt: "2026-04-26T07:47:00+05:30",
        fetchedAt: "2026-04-26T07:48:00+05:30",
        title: "Reliance expands partnership pipeline as retail and telecom capex picks up",
        url: "https://example.com/reliance-partnership-duplicate",
        content:
          "Reliance expansion, growth momentum, and strong partnership updates supported a breakout narrative with broad media confirmation.",
        tickersHint: ["RELIANCE"],
        rawPayload:
          "Reliance expansion, growth momentum, and strong partnership updates supported a breakout narrative with broad media confirmation.",
        rawPayloadFormat: "text",
        metadata: {}
      }
    ];
  }
}
