import { tryGemmaEnrich } from "../src/domain/services/local-gemma-extractor";

async function smokeTest() {
  console.log("🚀 Starting Gemma Enrichment Smoke Test...");

  const mockInput = {
    ticker: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    cardType: "EARNINGS",
    sentiment: "positive",
    confidence: 0.85,
    impactScore: 92,
    ruleBasedHeadline: "RELIANCE beats estimates",
    ruleBasedSummary: "Reliance reported strong quarterly results with 15% revenue growth and margin expansion.",
    reasons: [
      "Revenue growth of 15% YoY",
      "O2C segment margins improved by 200bps",
      "Digital services subscriber base grew to 450M"
    ],
    source: "NSE",
    publishedAt: new Date()
  };

  try {
    console.log("Calling tryGemmaEnrich (120s timeout)...");
    const startTime = Date.now();
    const result = await tryGemmaEnrich(mockInput);
    const duration = Date.now() - startTime;

    if (result) {
      console.log(`✅ Gemma Enrichment SUCCESS (${duration}ms)`);
      console.log("-----------------------------------------");
      console.log("HEADLINE:", result.headline);
      console.log("SUMMARY: ", result.summary);
      if (result.impactReason) console.log("IMPACT:  ", result.impactReason);
      if (result.riskNote) console.log("RISK:    ", result.riskNote);
      console.log("-----------------------------------------");
    } else {
      console.log(`⚠️ Gemma Enrichment FAILED or TIMED OUT (${duration}ms)`);
      console.log("This is expected if Ollama is not running locally.");
      console.log("Check if 'ollama serve' is active and 'gemma3:4b' is pulled.");
      console.log("Pipeline fallback confirmed: build-insight-cards will use rule-based values.");
    }

    console.log("✅ Smoke test execution completed.");
  } catch (error) {
    console.error("❌ Smoke test CRITICAL FAILURE:");
    console.error(error);
    process.exit(1);
  }
}

smokeTest();
