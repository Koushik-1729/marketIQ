import { apiError, apiSuccess } from "@/lib/api-response";
import { signalQuerySchema } from "@/lib/api-schemas";
import { logRouteError } from "@/lib/logger";
import { getSignals } from "@/application/use-cases/get-signals";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = signalQuerySchema.safeParse({
      ticker: searchParams.get("ticker") ?? undefined,
      minScore: searchParams.get("minScore") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      skip: searchParams.get("skip") ?? undefined,
      sort: searchParams.get("sort") ?? undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }

    const signals = await getSignals(parsed.data);
    return apiSuccess(
      {
        items: signals,
        pagination: {
          limit: parsed.data.limit,
          skip: parsed.data.skip,
          returned: signals.length
        }
      },
      200
    );
  } catch (error) {
    logRouteError("GET /api/signals", error);
    return apiError("Failed to fetch signals", 500);
  }
}
