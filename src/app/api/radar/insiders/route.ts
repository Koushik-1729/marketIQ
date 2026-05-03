import { getInsiderRadar } from "@/application/use-cases/get-insider-radar";
import { apiError, apiSuccess } from "@/lib/api-response";
import { insiderRadarQuerySchema } from "@/lib/api-schemas";
import { logRouteError } from "@/lib/logger";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = insiderRadarQuerySchema.safeParse({
      ticker: searchParams.get("ticker") ?? undefined,
      limit: searchParams.get("limit") ?? undefined
    });

    if (!parsed.success) {
      return apiError("Invalid query parameters", 400, parsed.error.flatten());
    }

    const data = await getInsiderRadar(parsed.data);
    return apiSuccess(data, 200);
  } catch (error) {
    logRouteError("GET /api/radar/insiders", error);
    return apiError("Failed to fetch insider radar", 500);
  }
}
