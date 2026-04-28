import { NextRequest } from "next/server";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { validateDealEvent } from "@/domain/services/validate-deal-event";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const resolvedParams = await params;
    const ticker = resolvedParams.ticker.toUpperCase();
    const deals = await engineRuntime.dealEventRepository.findRecentByTicker(ticker, 30);
    const validation = validateDealEvent(ticker, deals);

    return apiSuccess({
      timestamp: new Date().toISOString(),
      ticker,
      status: validation.status,
      note: validation.note,
      deals
    }, 200);
  } catch (error) {
    // If the error occurs before params resolution, fallback safely
    logRouteError(`GET /api/deals/[ticker]`, error);
    return apiError("Failed to fetch deals for ticker", 500);
  }
}
