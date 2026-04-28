import { NextRequest } from "next/server";
import { fetchMarketData } from "@/adapters/inbound/sources/market-data-source";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  
  try {
    if (!ticker) {
      return apiError("Ticker is required", 400);
    }

    const bars = await fetchMarketData(ticker);
    return apiSuccess({
      ticker,
      barsCount: bars.length,
      data: bars
    }, 200);
  } catch (error) {
    logRouteError(`GET /api/market-data/${ticker}`, error);
    return apiError("Failed to fetch market data", 500);
  }
}
