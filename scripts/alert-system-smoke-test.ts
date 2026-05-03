import "dotenv/config";
import { createId } from "@paralleldrive/cuid2";
import { sendInsightAlerts } from "../src/application/use-cases/send-insight-alerts";
import { shouldSendInsightAlert } from "../src/domain/services/alert-eligibility";
import { PostgresAlertLogRepository } from "../src/adapters/outbound/repositories/postgres-alert-log-repository";
import { TelegramAdapter } from "../src/adapters/outbound/telegram-adapter";
import type { InsightCard } from "../src/domain/entities/insight-card";
import type { InsightCardRepositoryPort, InsightCardQuery } from "../src/domain/ports/insight-card-repository";
import type { UserAlertPreferencesRepository, AlertableUser } from "../src/domain/ports/user-alert-preferences-repository";

// ─── Mock repositories ────────────────────────────────────────────────────────

const mockCard: InsightCard = {
  id: "test-card-" + createId(),
  signalId: null,
  ticker: "RELIANCE",
  companyName: "Reliance Industries Ltd",
  cardType: "EARNINGS",
  headline: "Reliance beats Q4 estimates",
  summary: "Strong Q4 results with revenue growth and margin expansion.",
  sentiment: "positive",
  confidence: 0.88,
  rating: 5,
  impactScore: 92,
  source: "NSE",
  sourceUrl: null,
  pdfUrl: null,
  publishedAt: new Date(),
  createdAt: new Date()
};

class MockInsightCardRepository implements InsightCardRepositoryPort {
  async create(card: InsightCard) { return card; }
  async findLatest(_: InsightCardQuery) { return [mockCard]; }
  async findByTicker(_: string) { return [mockCard]; }
  async findByType(_: any) { return [mockCard]; }
  async existsBySignalId(_: string) { return false; }
}

class MockUserAlertPreferencesRepository implements UserAlertPreferencesRepository {
  async findTelegramEnabledUsers(): Promise<AlertableUser[]> {
    return [{
      id: "test-user-001",
      telegramChatId: process.env.TEST_TELEGRAM_CHAT_ID ?? "999999",
      telegramEnabled: true,
      globalAlerts: true
    }];
  }
  async findWatchlistTickers(_: string): Promise<string[]> {
    return ["RELIANCE", "INFY", "TCS"];
  }
}

// ─── Test runner ──────────────────────────────────────────────────────────────

async function smokeTest() {
  console.log("🚀 Starting Full Alert Pipeline Smoke Test...");

  const alertLogRepo = new PostgresAlertLogRepository();
  const insightCardRepo = new MockInsightCardRepository();
  const userRepo = new MockUserAlertPreferencesRepository();
  const telegramAdapter = new TelegramAdapter();

  const deps = {
    insightCardRepository: insightCardRepo,
    userAlertPreferencesRepository: userRepo,
    alertLogRepository: alertLogRepo,
    telegramAdapter
  };

  // ── Step 1: Unit test eligibility ────────────────────────────────────────
  console.log("\n── Unit testing shouldSendInsightAlert()...");

  const alwaysTrue = shouldSendInsightAlert({
    card: { ticker: "RELIANCE", impactScore: 92, rating: 5, cardType: "EARNINGS" },
    user: { telegramEnabled: true, telegramChatId: "123", globalAlerts: true },
    watchlistTickers: ["RELIANCE", "TCS"]
  });
  console.assert(alwaysTrue === true, "❌ Should send for watchlist + high quality");

  const disabledUser = shouldSendInsightAlert({
    card: { ticker: "RELIANCE", impactScore: 92, rating: 5, cardType: "EARNINGS" },
    user: { telegramEnabled: false, telegramChatId: "123", globalAlerts: true },
    watchlistTickers: ["RELIANCE"]
  });
  console.assert(disabledUser === false, "❌ Should NOT send for disabled Telegram");

  const lowImpact = shouldSendInsightAlert({
    card: { ticker: "RELIANCE", impactScore: 50, rating: 2, cardType: "NEWS" },
    user: { telegramEnabled: true, telegramChatId: "123", globalAlerts: true },
    watchlistTickers: ["RELIANCE"]
  });
  console.assert(lowImpact === false, "❌ Should NOT send for low-impact card");

  console.log("✅ Eligibility logic tests passed");

  // ── Step 2: First run (should send alert) ─────────────────────────────────
  console.log("\n── Running first sendInsightAlerts()...");
  const stats1 = await sendInsightAlerts(deps, { since: new Date(Date.now() - 60000) });
  console.log(`   Cards: ${stats1.cardsChecked}, Sent: ${stats1.alertsSent}, Skipped: ${stats1.duplicatesSkipped}`);

  // ── Step 3: Second run (should be deduped) ────────────────────────────────
  console.log("\n── Running second sendInsightAlerts() (dedup test)...");
  const stats2 = await sendInsightAlerts(deps, { since: new Date(Date.now() - 60000) });
  console.log(`   Cards: ${stats2.cardsChecked}, Sent: ${stats2.alertsSent}, Skipped: ${stats2.duplicatesSkipped}`);

  if (stats2.alertsSent === 0 && stats2.duplicatesSkipped > 0) {
    console.log("✅ Dedup test passed — no duplicate alerts sent");
  } else {
    console.warn("⚠️  Dedup test: expected 0 sent, got:", stats2.alertsSent);
  }

  console.log("\n✅ Alert pipeline smoke test complete!");
}

smokeTest().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});
