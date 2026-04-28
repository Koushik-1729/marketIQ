export type MarketContext = {
  niftyTrend: "bull" | "neutral" | "bear";
  bankNiftyTrend: "bull" | "neutral" | "bear";
  giftNiftyChange: number;
  indiaVix: number;
  fiiFlowCr: number;
  diiFlowCr: number;
  globalCues: "positive" | "mixed" | "negative";
  sectorStrength: Record<string, number>;
};
