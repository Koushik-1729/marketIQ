import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET() {
  try {
    const report = await getLatestReport();
    return apiSuccess(report, 200);
  } catch (error) {
    logRouteError("GET /api/reports/latest", error);
    return apiError("Failed to fetch latest report", 500);
  }
}
