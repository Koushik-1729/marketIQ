export type PriceValidation = {
  ticker: string;
  priceChangePercent: number;
  volumeRatio: number;
  volumeScore: number;
  volatility: number;
  momentumPersistence: boolean;
  confirmationStatus: "CONFIRMED" | "WEAK" | "NEUTRAL" | "CONTRADICTION" | "NO_DATA";
  note: string;
};
