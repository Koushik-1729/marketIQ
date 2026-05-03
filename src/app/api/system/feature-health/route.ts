import { getFeatureHealth } from "@/application/use-cases/get-feature-health";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET() {
  try {
    const data = await getFeatureHealth();
    return apiSuccess(data, 200);
  } catch (error) {
    logRouteError("GET /api/system/feature-health", error);
    return apiError("Failed to fetch feature health", 500);
  }
}
