import "dotenv/config";
import { TelegramAdapter, formatAlertMessage } from "../src/adapters/outbound/telegram-adapter";

const TEST_CHAT_ID = process.env.TEST_TELEGRAM_CHAT_ID;

async function smokeTest() {
  console.log("🚀 Starting Telegram Alert Smoke Test...");

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.error("❌ TELEGRAM_BOT_TOKEN is not set in .env");
    process.exit(1);
  }

  if (!TEST_CHAT_ID) {
    console.error("❌ TEST_TELEGRAM_CHAT_ID is not set in .env");
    process.exit(1);
  }

  const adapter = new TelegramAdapter();

  const mockCard = {
    id: "test-card-001",
    signalId: "test-signal-001",
    ticker: "RELIANCE",
    companyName: "Reliance Industries Ltd",
    cardType: "EARNINGS" as const,
    headline: "Reliance beats Q4 estimates with strong O2C margins",
    summary: "Reliance Industries reported Q4 net profit up 7% YoY at ₹19,407 Cr, beating analyst consensus of ₹18,200 Cr, driven by strong O2C margins and JIO subscriber growth.",
    sentiment: "positive" as const,
    confidence: 0.88,
    rating: 5,
    impactScore: 92,
    source: "NSE",
    sourceUrl: "https://www.nseindia.com/companies-listing/corporate-filings-announcements",
    pdfUrl: null,
    publishedAt: new Date(),
    createdAt: new Date()
  };

  const message = formatAlertMessage(mockCard, {
    impactReason: "Strong O2C margin expansion and digital subscriber growth signal continued outperformance.",
    riskNote: "Global crude volatility and regulatory changes in telecom remain watch points."
  });

  console.log("\n─── Preview of message to be sent ─────────────────────────────");
  console.log(message);
  console.log("────────────────────────────────────────────────────────────────\n");

  try {
    await adapter.sendMessage(TEST_CHAT_ID, message);
    console.log(`✅ Message sent to chatId=${TEST_CHAT_ID}`);
    console.log("✅ Smoke test passed!");
  } catch (error) {
    console.error("❌ Failed to send message:", error);
    process.exit(1);
  }
}

smokeTest();
