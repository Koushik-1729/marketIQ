import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { withTimeoutValue } from "@/lib/async-utils";

export async function GET() {
  try {
    const cards = await withTimeoutValue(
      () => engineRuntime.insightCardRepository.findLatest({ limit: 20 }),
      []
    );
    return apiSuccess({ cards }, 200);
  } catch (error) {
    logRouteError("GET /api/insights/latest", error);
    return apiError("Failed to fetch latest insights", 500);
  }
}
