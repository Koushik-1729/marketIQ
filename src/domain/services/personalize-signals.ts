import type { EngineSignal } from "@/domain/entities/engine-signal";

export type WatchlistPreference = {
  tickers: string[];
  sectors: string[];
  themes: string[];
};

export function rankSignalsForWatchlist(
  signals: EngineSignal[],
  preference: WatchlistPreference
) {
  return [...signals]
    .map((signal) => {
      const tickerBoost = preference.tickers.includes(signal.ticker) ? 14 : 0;
      const sectorBoost = preference.sectors.includes(signal.sector) ? 8 : 0;
      const themeBoost =
        preference.themes.includes("capital-expenditure") &&
        signal.eventType === "order_win"
          ? 5
          : 0;

      return {
        signal,
        personalizedScore:
          signal.impactScore + tickerBoost + sectorBoost + themeBoost
      };
    })
    .sort((left, right) => right.personalizedScore - left.personalizedScore);
}
