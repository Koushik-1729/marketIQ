import "dotenv/config";
import { filterValidTickers, isValidTicker, normalizeTicker } from "../src/domain/services/ticker-validator";

function runTests() {
  console.log("🚀 Ticker Validator Smoke Test\n");

  // ─── 1. normalizeTicker ────────────────────────────────────────────────────
  const normalCases = [
    { input: " reliance ", expected: "RELIANCE" },
    { input: "bajaj-auto", expected: "BAJAJ-AUTO" },
    { input: "hdfc bank", expected: "HDFCBANK" },
    { input: "Q4 FY27", expected: "Q4FY27" }
  ];

  console.log("── normalizeTicker() ───────────────────────────────────────");
  let passed = 0;
  for (const { input, expected } of normalCases) {
    const result = normalizeTicker(input);
    const ok = result === expected;
    console.log(`  ${ok ? "✅" : "❌"} normalizeTicker("${input}") → "${result}" (expected: "${expected}")`);
    if (ok) passed++;
  }

  // ─── 2. Blacklist / Invalid candidates ────────────────────────────────────
  const invalidCandidates = ["AM", "PM", "Q4", "EBITDA", "FY27", "US", "CEO", "NSE", "BSE", "CDMO", "DAM", "R32"];
  console.log("\n── isValidTicker() — should ALL be false ───────────────────");
  let invalidPassed = 0;
  for (const ticker of invalidCandidates) {
    const result = isValidTicker(ticker);
    const ok = !result;
    console.log(`  ${ok ? "✅" : "❌"} isValidTicker("${ticker}") → ${result} (expected: false)`);
    if (ok) invalidPassed++;
  }

  // ─── 3. Valid NSE tickers ─────────────────────────────────────────────────
  const validCandidates = ["HINDUNILVR", "BAJAJ-AUTO", "HEG", "RELIANCE", "TCS", "INFY", "HDFCBANK"];
  console.log("\n── isValidTicker() — checking NSE universe membership ──────");
  // HEG is not in our universe, expected false
  const expectedValid = new Set(["HINDUNILVR", "BAJAJ-AUTO", "RELIANCE", "TCS", "INFY", "HDFCBANK"]);
  let validPassed = 0;
  for (const ticker of validCandidates) {
    const result = isValidTicker(ticker);
    const expected = expectedValid.has(ticker);
    const ok = result === expected;
    console.log(`  ${ok ? "✅" : "❌"} isValidTicker("${ticker}") → ${result} (expected: ${expected})`);
    if (ok) validPassed++;
  }

  // ─── 4. filterValidTickers ────────────────────────────────────────────────
  const mixedInput = ["AM", "Q4", "EBITDA", "FY27", "HINDUNILVR", "BAJAJ-AUTO", "HEG", "RELIANCE"];
  const filtered = filterValidTickers(mixedInput);
  const expectedFiltered = ["HINDUNILVR", "BAJAJ-AUTO", "RELIANCE"];
  const filterOk =
    filtered.length === expectedFiltered.length &&
    expectedFiltered.every((t) => filtered.includes(t));

  console.log("\n── filterValidTickers() ────────────────────────────────────");
  console.log(`  Input:    [${mixedInput.join(", ")}]`);
  console.log(`  Output:   [${filtered.join(", ")}]`);
  console.log(`  Expected: [${expectedFiltered.join(", ")}]`);
  console.log(`  ${filterOk ? "✅" : "❌"} filterValidTickers() test ${filterOk ? "PASSED" : "FAILED"}`);

  // ─── Summary ──────────────────────────────────────────────────────────────
  const totalPassed = invalidPassed + validPassed + (filterOk ? 1 : 0);
  const totalTests = invalidCandidates.length + validCandidates.length + 1;
  console.log(`\n${"─".repeat(60)}`);
  console.log(`Tests passed: ${totalPassed}/${totalTests}`);
  if (totalPassed === totalTests) {
    console.log("✅ All tests passed!");
  } else {
    console.warn("⚠️  Some tests failed — review output above.");
    process.exit(1);
  }
}

runTests();
