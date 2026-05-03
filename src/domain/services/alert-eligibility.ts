// ─── Pure domain service — no Prisma, no fetch, no side effects ──────────────

export type AlertEligibilityInput = {
  card: {
    ticker: string;
    impactScore: number;
    rating: number;
    cardType: string;
  };
  user: {
    telegramEnabled: boolean;
    telegramChatId?: string | null;
    globalAlerts: boolean;
  };
  watchlistTickers: string[];
};

/**
 * Pure eligibility check for whether an InsightCard alert should be sent.
 *
 * Rules (in order):
 * 1. User must have Telegram enabled.
 * 2. User must have a telegramChatId.
 * 3. Card must meet minimum quality bar (impactScore ≥ 75 AND rating ≥ 4).
 * 4. THEN: send if ticker is in user's watchlist.
 * 5. OR send if globalAlerts is true AND impactScore ≥ 85 (market-wide alert).
 * 6. Otherwise false — do not spam.
 */
export function shouldSendInsightAlert(input: AlertEligibilityInput): boolean {
  const { card, user, watchlistTickers } = input;

  // Gate 1: Telegram must be configured
  if (!user.telegramEnabled) return false;
  if (!user.telegramChatId) return false;

  // Gate 2: Card must meet quality bar
  const meetsQualityBar = card.impactScore >= 75 && card.rating >= 4;
  if (!meetsQualityBar) return false;

  // Rule 4: Watchlist match
  const inWatchlist = watchlistTickers.includes(card.ticker);
  if (inWatchlist) return true;

  // Rule 5: Global high-impact alert
  const isGlobalAlert = user.globalAlerts && card.impactScore >= 85;
  if (isGlobalAlert) return true;

  return false;
}
