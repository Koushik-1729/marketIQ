import { startManualSignalEngineJob } from "@/application/jobs/run-signal-engine-job";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function POST() {
  try {
    const result = startManualSignalEngineJob();

    return apiSuccess(
      {
        message: "Manual run started",
        status: result.status,
        startedAt: result.startedAt
      },
      202
    );
  } catch (error) {
    logRouteError("POST /api/signals/run", error);
    return apiError("Failed to run signal engine", 500);
  }
}
