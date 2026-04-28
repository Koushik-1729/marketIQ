import type { MarketSignal } from "@/domain/entities/signal";

export type DashboardData = {
  marketMood: string;
  giftNifty: string;
  fiiDii: string;
  topSignals: MarketSignal[];
  watchlistSignals: MarketSignal[];
  riskSignals: MarketSignal[];
};
