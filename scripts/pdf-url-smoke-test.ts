import { config } from "dotenv";
import { resolve } from "path";
// Ensure .env is loaded before anything else
config({ path: resolve(process.cwd(), ".env") });

import { engineRuntime } from "@/application/runtime/engine-runtime";
import { NseFilingsSourceAdapter } from "@/adapters/inbound/sources/nse-filings-source";
import { BseAnnouncementsSourceAdapter } from "@/adapters/inbound/sources/bse-announcements-source";
import { extractEvents } from "@/domain/services/extract-events";
import { clusterEvents } from "@/domain/services/cluster-events";
import { scoreSignal } from "@/domain/services/score-signal";
import { buildInsightCard } from "@/domain/services/build-insight-card";

async function runSmokeTest() {
  console.log("🚀 Starting PDF URL Smoke Test...\n");

  const nseAdapter = new NseFilingsSourceAdapter();
  const bseAdapter = new BseAnnouncementsSourceAdapter();

  const bseDocs = await bseAdapter.fetchLatest().catch(e => {
    console.error("BSE fetch failed, ignoring for smoke test:", e.message);
    return [];
  });

  const nseDocs = await nseAdapter.fetchLatest().catch(e => {
    console.error("NSE fetch failed:", e.message);
    return [];
  });

  console.log(`\nFetched ${nseDocs.length} NSE docs and ${bseDocs.length} BSE docs.`);

  const allDocs = [...nseDocs, ...bseDocs];
  
  const docsWithPdf = allDocs.filter(d => d.pdfUrl);
  console.log(`\n✅ Found ${docsWithPdf.length} documents with PDF URLs.`);

  if (docsWithPdf.length === 0) {
    console.log("⚠️ No PDFs found. The sources might not have attachments right now or the parsing regex needs adjustments depending on actual HTML structure today.");
  } else {
    console.log(`Sample PDF URL: ${docsWithPdf[0].pdfUrl}`);
  }

  // Pick a doc with PDF to test the pipeline (if any) or just the first doc
  const targetDoc = docsWithPdf[0] || allDocs.find(d => d.tickersHint?.length > 0) || allDocs[0];
  
  if (!targetDoc) {
     console.log("No docs available to test pipeline.");
     return;
  }

  console.log(`\n2. Running extraction pipeline for: ${targetDoc.title}`);
  
  // Fake normalization for test
  const fakeNormalized = {
    id: `norm-${targetDoc.id}`,
    rawDocumentId: targetDoc.id,
    canonicalTitle: targetDoc.title,
    canonicalContent: targetDoc.content,
    urlHash: targetDoc.urlHash,
    titleHash: `title-${targetDoc.id}`,
    contentHash: `content-${targetDoc.id}`,
    isDuplicate: false
  };

  const extracted = extractEvents([targetDoc], [fakeNormalized]);
  console.log(`Extracted ${extracted.length} events.`);

  if (extracted.length > 0) {
    const event = extracted[0];
    console.log(`ExtractedEvent pdfUrl: ${event.pdfUrl}`);

    // Fake enrichment
    const enriched = {
      ...event,
      eventType: "earnings",
      sentiment: "positive",
      confidence: 0.9,
      eventWeight: 1.0,
      sourceCredibilityScore: 1.0,
      isRumorLike: false
    } as any;

    const clusters = clusterEvents([enriched]);
    const cluster = clusters[0];
    console.log(`EventCluster pdfUrls: ${cluster.pdfUrls.join(', ')}`);

    const signal = scoreSignal({
      cluster,
      context: {
        niftyTrend: "bull",
        bankNiftyTrend: "bull",
        giftNiftyChange: 50,
        indiaVix: 15,
        fiiFlowCr: 500,
        diiFlowCr: 500,
        globalCues: "positive",
        sectorStrength: {}
      },
      priceValidation: undefined,
      sectorValidation: undefined,
      flowValidation: undefined,
      dealValidation: undefined,
      conflictPenalty: 0,
      conflictReason: null,
      conflictFlag: false
    });
    
    console.log(`EngineSignal pdfUrls: ${signal.pdfUrls.join(', ')}`);

    const card = buildInsightCard(signal);
    console.log(`InsightCard pdfUrl: ${card.pdfUrl}`);
    
    if (card.pdfUrl === targetDoc.pdfUrl) {
       console.log(`\n🎉 SUCCESS: PDF URL propagated correctly from RawDocument to InsightCard!`);
    } else {
       console.log(`\n❌ FAILED: PDF URL did not propagate.`);
    }
  }

  process.exit(0);
}

runSmokeTest().catch(console.error);
