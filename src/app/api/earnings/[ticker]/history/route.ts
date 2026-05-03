import { getEarningsHistory } from "@/application/use-cases/get-earnings-history";
import { apiError, apiSuccess } from "@/lib/api-response";
import { earningsHistoryQuerySchema } from "@/lib/api-schemas";
import { logRouteError } from "@/lib/logger";

export async function GET(
  request: Request,
  context: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await context.params;
    const { searchParams } = new URL(request.url);
    const parsed = earningsHistoryQuerySchema.safeParse({
      limit: searchParams.get("limit") ?? undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }

    const data = await getEarningsHistory(ticker, parsed.data.limit);

    if (data.events.length === 0) {
      return apiError("No earnings history found for ticker", 404);
    }

    return apiSuccess(data, 200);
  } catch (error) {
    logRouteError("GET /api/earnings/[ticker]/history", error);
    return apiError("Failed to fetch earnings history", 500);
  }
}
