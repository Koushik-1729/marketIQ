import { getSignalById } from "@/application/use-cases/get-signal-by-id";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const signal = await getSignalById(id);

    if (!signal) {
      return apiError("Signal not found", 404);
    }

    return apiSuccess(signal, 200);
  } catch (error) {
    logRouteError("GET /api/signals/:id", error);
    return apiError("Failed to fetch signal", 500);
  }
}
