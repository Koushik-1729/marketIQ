import "dotenv/config";
import { resolveTickerEvent } from "../src/domain/services/ticker-event-resolver";

function runTests() {
  console.log("🚀 Analyst-Grade Ticker + Event Resolver Smoke Test\n");

  const testCases = [
    {
      name: "Valid Earnings with Numbers",
      input: {
        title: "HUL Q4 EBITDA margin expands 200 bps",
        content: "Hindustan Unilever reported strong Q4 results with EBITDA margin expanding by 200 bps.",
        tickersHint: [],
        sourceKind: "news",
        sourceName: "Economic Times"
      },
      expected: {
        ticker: "HINDUNILVR",
        eventType: "earnings",
        hasImportantNumbers: true,
        shouldResolve: true
      }
    },
    {
      name: "Source/Noise Word",
      input: {
        title: "CNBCTV18 live view now",
        content: "Watch CNBCTV18 live for market updates.",
        tickersHint: [],
        sourceKind: "news",
        sourceName: "CNBC TV18"
      },
      expected: {
        shouldResolve: false
      }
    },
    {
      name: "Valid Earnings without Numbers (but explicit valid company name)",
      input: {
        title: "HEG reports strong Q4 PAT growth",
        content: "HEG Ltd announced strong profit growth for the quarter.",
        tickersHint: [],
        sourceKind: "news",
        sourceName: "Moneycontrol"
      },
      expected: {
        ticker: "HEG",
        eventType: "earnings",
        shouldResolve: true
      }
    },
    {
      name: "Financial Terms only, No Company",
      input: {
        title: "Q4 EBITDA FY27 outlook",
        content: "Analysts discuss the Q4 EBITDA and FY27 outlook for the IT sector.",
        tickersHint: ["Q4", "EBITDA"],
        sourceKind: "news",
        sourceName: "Reuters Markets"
      },
      expected: {
        shouldResolve: false
      }
    },
    {
      name: "Corporate Action",
      input: {
        title: "BAJAJ AUTO announces dividend record date",
        content: "Bajaj Auto Ltd has fixed the record date for its upcoming dividend payment.",
        tickersHint: ["BAJAJ-AUTO"],
        sourceKind: "news",
        sourceName: "Business Standard"
      },
      expected: {
        ticker: "BAJAJ-AUTO",
        eventType: "insider_activity", // mapped from CORPORATE_ACTION_KW
        shouldResolve: true
      }
    }
  ];

  let passed = 0;
  for (const tc of testCases) {
    console.log(`\n── Test: ${tc.name} ─────────────────────`);
    const result = resolveTickerEvent(tc.input);

    let ok = true;
    if (tc.expected.shouldResolve) {
      if (!result) {
        console.log(`❌ Expected to resolve, but got null.`);
        ok = false;
      } else {
        if (result.ticker !== tc.expected.ticker) {
          console.log(`❌ Expected ticker ${tc.expected.ticker}, got ${result.ticker}`);
          ok = false;
        }
        if (result.eventType !== tc.expected.eventType) {
          console.log(`❌ Expected eventType ${tc.expected.eventType}, got ${result.eventType}`);
          ok = false;
        }
        if (tc.expected.hasImportantNumbers !== undefined) {
          const hasNums = result.importantNumbers.length > 0;
          if (hasNums !== tc.expected.hasImportantNumbers) {
            console.log(`❌ Expected hasImportantNumbers=${tc.expected.hasImportantNumbers}, got ${hasNums} (${result.importantNumbers})`);
            ok = false;
          }
        }
        if (ok) {
          console.log(`✅ Resolved ${result.ticker} | ${result.eventType}`);
          console.log(`   Numbers: [${result.importantNumbers.join(", ")}]`);
        }
      }
    } else {
      if (result) {
        console.log(`❌ Expected null, but got resolved event: ${JSON.stringify(result)}`);
        ok = false;
      } else {
        console.log(`✅ Correctly skipped.`);
      }
    }
    if (ok) passed++;
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`Tests passed: ${passed}/${testCases.length}`);
  if (passed === testCases.length) {
    console.log("✅ All tests passed!");
  } else {
    console.warn("⚠️  Some tests failed.");
    process.exit(1);
  }
}

runTests();
