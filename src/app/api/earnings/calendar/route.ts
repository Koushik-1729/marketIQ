import { getUpcomingEarnings } from "@/application/use-cases/get-upcoming-earnings";
import { apiError, apiSuccess } from "@/lib/api-response";
import { earningsCalendarQuerySchema } from "@/lib/api-schemas";
import { logRouteError } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = earningsCalendarQuerySchema.safeParse({
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      limit: searchParams.get("limit") ?? undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }

    const items = await getUpcomingEarnings(parsed.data);
    return apiSuccess(
      {
        items,
        pagination: {
          limit: parsed.data.limit,
          returned: items.length
        }
      },
      200
    );
  } catch (error) {
    logRouteError("GET /api/earnings/calendar", error);
    return apiError("Failed to fetch earnings calendar", 500);
  }
}
