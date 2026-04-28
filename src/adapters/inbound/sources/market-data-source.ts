import { getYahooTicker } from "@/domain/data/ticker-mapping";
import type { PriceBar } from "@/domain/ports/price-bar-repository";

// Simple in-memory cache to avoid hitting Yahoo Finance too frequently
const cache = new Map<string, { timestamp: number; data: Omit<PriceBar, "id" | "createdAt">[] }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function fetchMarketData(ticker: string): Promise<Omit<PriceBar, "id" | "createdAt">[]> {
  const yahooTicker = getYahooTicker(ticker);
  
  if (cache.has(yahooTicker)) {
    const cached = cache.get(yahooTicker)!;
    if (Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
  }

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=5m&range=1d`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[market-data-source] Failed to fetch data for ${yahooTicker}: ${response.statusText}`);
      return [];
    }

    const json = await response.json();
    const result = json.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return [];
    }

    const timestamps: number[] = result.timestamp;
    const quote = result.indicators.quote[0];
    
    const bars: Omit<PriceBar, "id" | "createdAt">[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] === null || quote.close[i] === null) continue;

      bars.push({
        ticker, // Store the original ticker
        timestamp: new Date(timestamps[i] * 1000),
        open: quote.open[i] as number,
        high: quote.high[i] as number,
        low: quote.low[i] as number,
        close: quote.close[i] as number,
        volume: quote.volume[i] as number,
        interval: "5m",
        source: "yahoo_finance"
      });
    }

    cache.set(yahooTicker, { timestamp: Date.now(), data: bars });
    return bars;

  } catch (error) {
    console.error(`[market-data-source] Error fetching data for ${yahooTicker}:`, error);
    return [];
  }
}
