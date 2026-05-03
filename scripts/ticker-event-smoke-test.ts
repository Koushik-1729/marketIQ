import { extractEvents } from "../src/domain/services/extract-events";
import { RawDocument } from "../src/domain/entities/raw-document";
import { NormalizedDocument } from "../src/domain/entities/normalized-document";

async function runTests() {
  console.log("🚀 Starting Analyst-Grade Ticker + Event Smoke Test...\n");

  const testCases = [
    {
      name: "HUL Earnings",
      input: "HUL Q4 EBITDA margin expands 200 bps",
      expectedTicker: "HINDUNILVR",
      expectedEvent: "earnings"
    },
    {
      name: "Noise Filter (CNBC)",
      input: "CNBCTV18 live view now",
      expectedTicker: null,
      expectedEvent: null
    },
    {
      name: "HEG Earnings",
      input: "HEG reports strong Q4 PAT growth",
      expectedTicker: "HEG",
      expectedEvent: "earnings"
    },
    {
      name: "Noise Filter (EBITDA FY27)",
      input: "Q4 EBITDA FY27 outlook",
      expectedTicker: null,
      expectedEvent: null
    },
    {
      name: "Bajaj Auto Dividend",
      input: "BAJAJ AUTO declares dividend",
      expectedTicker: "BAJAJ-AUTO",
      expectedEvent: "corporate_action"
    },
    {
      name: "HDFC Bank Results",
      input: "HDFC BANK reports Q4 results",
      expectedTicker: "HDFCBANK",
      expectedEvent: "earnings"
    },
    {
      name: "Tata Motors Order",
      input: "TATA MOTORS wins order",
      expectedTicker: "TATAMOTORS",
      expectedEvent: "order"
    }
  ];

  for (const tc of testCases) {
    console.log(`Testing: "${tc.input}"`);
    
    const raw: RawDocument = {
      id: "test-id",
      sourceName: "Test Source",
      sourceKind: "news",
      sourceReliabilityScore: 8,
      url: "http://test.com",
      title: tc.input,
      content: tc.input,
      publishedAt: new Date().toISOString(),
      fetchedAt: new Date().toISOString(),
      tickersHint: [],
      rawPayload: tc.input,
      rawPayloadFormat: "text",
      urlHash: "hash",
      metadata: {}
    };

    const norm: NormalizedDocument = {
      id: "norm-id",
      rawDocumentId: "test-id",
      canonicalTitle: tc.input,
      canonicalContent: tc.input,
      urlHash: "hash",
      titleHash: "title-hash",
      contentHash: "content-hash",
      isDuplicate: false,
    };

    const events = extractEvents([raw], [norm]);

    if (tc.expectedTicker === null) {
      if (events.length === 0) {
        console.log("✅ Correctly skipped (no signal generated)\n");
      } else {
        console.log(`❌ FAILED: Expected no signal, but got ${events[0].ticker}\n`);
      }
    } else {
      if (events.length > 0 && events[0].ticker === tc.expectedTicker && events[0].eventType === tc.expectedEvent) {
        console.log(`✅ SUCCESS: Resolved ${events[0].ticker} as ${events[0].eventType}\n`);
      } else {
        console.log(`❌ FAILED: Expected ${tc.expectedTicker} (${tc.expectedEvent}), but got ${events[0]?.ticker} (${events[0]?.eventType})\n`);
      }
    }
  }
}

runTests().catch(console.error);
