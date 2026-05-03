import { engineRuntime } from "../src/application/runtime/engine-runtime";
import { runSignalEngine } from "../src/application/use-cases/run-signal-engine";

async function smokeTest() {
  console.log("🚀 Starting InsightCard Smoke Test...");

  try {
    // 1. Check if InsightCard repository is available
    console.log("Checking InsightCard repository...");
    if (!engineRuntime.insightCardRepository) {
      throw new Error("InsightCard repository not found in engineRuntime");
    }

    // 2. Simulate a signal engine run (optional: might be slow/need DB)
    // console.log("Simulating signal engine run to generate cards...");
    // await runSignalEngine(false); // don't perform ingestion for test

    // 3. Test Repository methods
    console.log("Testing repository findLatest...");
    const latestCards = await engineRuntime.insightCardRepository.findLatest({ limit: 5 });
    console.log(`Found ${latestCards.length} cards in DB.`);

    // 4. Test API structure (Mock check)
    console.log("Verifying card structure...");
    if (latestCards.length > 0) {
      const card = latestCards[0];
      const requiredKeys: (keyof typeof card)[] = [
        "id", "ticker", "companyName", "cardType", "headline", 
        "summary", "sentiment", "confidence", "rating", "impactScore"
      ];
      
      for (const key of requiredKeys) {
        if (card[key] === undefined) {
          throw new Error(`Card is missing required key: ${key}`);
        }
      }
      console.log("✅ Card structure is valid.");
    } else {
      console.log("⚠️ No cards found to verify structure. Run the engine to generate some.");
    }

    console.log("✅ Smoke test passed!");
  } catch (error) {
    console.error("❌ Smoke test failed:");
    console.error(error);
    process.exit(1);
  }
}

smokeTest();
