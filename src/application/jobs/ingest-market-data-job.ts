import { engineRuntime } from "@/application/runtime/engine-runtime";
import { fetchMarketData } from "@/adapters/inbound/sources/market-data-source";

export async function ingestMarketDataJob() {
  console.info("[ingest-market-data-job] Starting market data ingestion");

  const job = await engineRuntime.jobRunRepository.createRunning("ingest-market-data");
  const runId = job.id;

  try {
    const watchlist = await engineRuntime.watchlistRepository.getPrimaryWatchlist();
    const tickersToFetch = new Set(watchlist.tickers);
    
    // Always include a few standard ones if watchlist is empty
    if (tickersToFetch.size === 0) {
      ["TCS", "RELIANCE", "INFY", "HDFCBANK"].forEach(t => tickersToFetch.add(t));
    }

    const allBars = [];
    
    for (const ticker of tickersToFetch) {
      console.info(`[ingest-market-data-job] Fetching for ${ticker}...`);
      const bars = await fetchMarketData(ticker);
      if (bars.length > 0) {
        allBars.push(...bars);
      }
    }

    if (allBars.length > 0) {
      await engineRuntime.priceBarRepository.saveMany(allBars);
      console.info(`[ingest-market-data-job] Saved ${allBars.length} total bars`);
    }

    await engineRuntime.jobRunRepository.markSuccess(runId);
    
  } catch (error) {
    console.error("[ingest-market-data-job] Failed", error);
    await engineRuntime.jobRunRepository.markFailed(runId, error instanceof Error ? error.message : "Unknown error");
  }
}
