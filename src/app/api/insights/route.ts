import { apiError, apiSuccess } from "@/lib/api-response";
import { insightCardQuerySchema } from "@/lib/api-schemas";
import { logRouteError } from "@/lib/logger";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { withTimeoutValue } from "@/lib/async-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = insightCardQuerySchema.safeParse({
      ticker: searchParams.get("ticker") ?? undefined,
      type: searchParams.get("type") ?? undefined,
      sentiment: searchParams.get("sentiment") ?? undefined,
      limit: searchParams.get("limit") ?? undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }

    const cards = await withTimeoutValue(
      () => engineRuntime.insightCardRepository.findLatest(parsed.data),
      []
    );

    return apiSuccess({ cards }, 200);
  } catch (error) {
    logRouteError("GET /api/insights", error);
    return apiError("Failed to fetch insights", 500);
  }
}
