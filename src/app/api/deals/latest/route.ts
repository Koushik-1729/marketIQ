import { NextRequest } from "next/server";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const deals = await engineRuntime.dealEventRepository.findLatest(20);

    return apiSuccess({
      timestamp: new Date().toISOString(),
      deals
    }, 200);
  } catch (error) {
    logRouteError("GET /api/deals/latest", error);
    return apiError("Failed to fetch latest block/bulk deals", 500);
  }
}
