import { shouldSendInsightAlert } from "@/domain/services/alert-eligibility";
import { formatAlertMessage } from "@/adapters/outbound/telegram-adapter";
import type { AlertLogRepository } from "@/domain/ports/alert-log-repository";
import type { UserAlertPreferencesRepository } from "@/domain/ports/user-alert-preferences-repository";
import type { InsightCardRepositoryPort } from "@/domain/ports/insight-card-repository";
import type { TelegramAdapter } from "@/adapters/outbound/telegram-adapter";

export type AlertDeps = {
  insightCardRepository: InsightCardRepositoryPort;
  userAlertPreferencesRepository: UserAlertPreferencesRepository;
  alertLogRepository: AlertLogRepository;
  telegramAdapter: TelegramAdapter;
};

export type AlertOptions = {
  /** Only consider cards created at or after this time. Defaults to last 30 min. */
  since?: Date;
  /** Max number of cards to evaluate. Default 50. */
  limit?: number;
};

type AlertStats = {
  cardsChecked: number;
  usersChecked: number;
  alertsSent: number;
  duplicatesSkipped: number;
  failures: number;
};

/**
 * Main alert dispatch use case.
 * 
 * Flow:
 *  1. Fetch recent InsightCards (impact-first ordering)
 *  2. Fetch Telegram-enabled users
 *  3. For each user × card:
 *     a. Skip if already alerted (dedup via AlertLog)
 *     b. Check eligibility (pure domain service)
 *     c. Send Telegram message
 *     d. Record AlertLog
 */
export async function sendInsightAlerts(deps: AlertDeps, options: AlertOptions = {}): Promise<AlertStats> {
  const stats: AlertStats = {
    cardsChecked: 0,
    usersChecked: 0,
    alertsSent: 0,
    duplicatesSkipped: 0,
    failures: 0
  };

  const since = options.since ?? (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - 30);
    return d;
  })();
  const limit = options.limit ?? 50;

  // ── 1. Fetch recent high-impact cards ─────────────────────────────────────
  const cards = await deps.insightCardRepository.findLatest({ limit });
  stats.cardsChecked = cards.length;

  if (cards.length === 0) {
    console.log("[send-insight-alerts] No cards found.");
    return stats;
  }

  // Filter to cards created after `since`
  const recentCards = cards.filter(
    (c) => new Date(c.createdAt) >= since
  );

  if (recentCards.length === 0) {
    console.log(`[send-insight-alerts] No cards created after ${since.toISOString()}.`);
    return stats;
  }

  // ── 2. Fetch eligible users ────────────────────────────────────────────────
  const users = await deps.userAlertPreferencesRepository.findTelegramEnabledUsers();
  stats.usersChecked = users.length;

  if (users.length === 0) {
    console.log("[send-insight-alerts] No Telegram-enabled users found.");
    return stats;
  }

  // ── 3. Dispatch alerts ────────────────────────────────────────────────────
  for (const user of users) {
    let watchlistTickers: string[] = [];
    try {
      watchlistTickers = await deps.userAlertPreferencesRepository.findWatchlistTickers(user.id);
    } catch (error) {
      console.warn(`[send-insight-alerts] Failed to load watchlist for user=${user.id}:`, error);
    }

    for (const card of recentCards) {
      try {
        // a. Dedup check
        const alreadySent = await deps.alertLogRepository.exists(card.id, user.id, "telegram");
        if (alreadySent) {
          stats.duplicatesSkipped++;
          continue;
        }

        // b. Eligibility check (pure domain service — no I/O)
        const eligible = shouldSendInsightAlert({
          card: {
            ticker: card.ticker,
            impactScore: card.impactScore,
            rating: card.rating,
            cardType: card.cardType
          },
          user: {
            telegramEnabled: user.telegramEnabled,
            telegramChatId: user.telegramChatId,
            globalAlerts: user.globalAlerts
          },
          watchlistTickers
        });

        if (!eligible) continue;

        // c. Format & send
        const message = formatAlertMessage(card);
        await deps.telegramAdapter.sendMessage(user.telegramChatId, message);

        // d. Record in AlertLog (dedup guard)
        await deps.alertLogRepository.create({
          cardId: card.id,
          userId: user.id,
          channel: "telegram"
        });

        stats.alertsSent++;
        console.log(`[send-insight-alerts] Sent alert: card=${card.id} user=${user.id} ticker=${card.ticker}`);
      } catch (error) {
        stats.failures++;
        console.warn(`[send-insight-alerts] Failed for card=${card.id} user=${user.id}:`, error);
      }
    }
  }

  console.log(
    `[send-insight-alerts] Done. cards=${stats.cardsChecked} users=${stats.usersChecked} ` +
    `sent=${stats.alertsSent} skipped=${stats.duplicatesSkipped} failures=${stats.failures}`
  );

  return stats;
}
