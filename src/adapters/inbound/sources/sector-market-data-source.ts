import type { SectorBar } from "@/domain/ports/sector-bar-repository";
import { SECTOR_INDEX_MAPPING, NIFTY_50_TICKER } from "@/domain/data/sector-map";

// Simple in-memory cache to prevent Yahoo Finance rate limits
const cache = new Map<string, { data: SectorBar[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchSectorData(sectorName: string): Promise<SectorBar[]> {
  const indexTicker = SECTOR_INDEX_MAPPING[sectorName] || NIFTY_50_TICKER;
  return fetchIndexData(indexTicker, sectorName);
}

export async function fetchNifty50Data(): Promise<SectorBar[]> {
  return fetchIndexData(NIFTY_50_TICKER, "Nifty 50");
}

async function fetchIndexData(ticker: string, mappedSector: string): Promise<SectorBar[]> {
  const now = Date.now();
  const cached = cache.get(ticker);
  
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=5d`;
    
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error for ${ticker}: ${response.statusText}`);
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];

    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      return [];
    }

    const timestamps = result.timestamp as number[];
    const closePrices = result.indicators.quote[0].close as (number | null)[];

    const bars: SectorBar[] = [];

    for (let i = 0; i < timestamps.length; i++) {
      if (closePrices[i] === null || closePrices[i] === undefined) continue;

      const currentClose = closePrices[i] as number;
      let changePercent = 0;

      if (i > 0 && closePrices[i - 1] !== null && closePrices[i - 1] !== undefined) {
        const prevClose = closePrices[i - 1] as number;
        changePercent = ((currentClose - prevClose) / prevClose) * 100;
      }

      bars.push({
        id: "mock-id", // Will be stripped by repository
        sector: mappedSector,
        timestamp: new Date(timestamps[i] * 1000).toISOString(),
        close: currentClose,
        changePercent,
        relativeStrength: 0, // computed later
        momentumScore: 0, // computed later
        source: "yahoo_finance",
        createdAt: new Date().toISOString()
      });
    }

    // Sort descending by timestamp
    bars.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    cache.set(ticker, { data: bars, timestamp: now });
    return bars;

  } catch (error) {
    console.error(`[sector-market-data] Failed to fetch ${ticker}`, error);
    return [];
  }
}
