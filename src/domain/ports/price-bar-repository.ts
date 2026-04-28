export type PriceBar = {
  id: string;
  ticker: string;
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  interval: string;
  source: string;
  createdAt: Date;
};

export interface PriceBarRepository {
  saveMany(bars: Omit<PriceBar, "id" | "createdAt">[]): Promise<void>;
  findRecentByTicker(ticker: string, limit?: number): Promise<PriceBar[]>;
  findPreviousAverageVolume(ticker: string, barsToAverage: number): Promise<number>;
}
