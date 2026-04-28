import { NextRequest } from "next/server";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { validateInstitutionalFlow } from "@/domain/services/validate-institutional-flow";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const latestFlows = await engineRuntime.institutionalFlowRepository.findLatest("EQUITY");
    const validation = validateInstitutionalFlow(latestFlows);

    return apiSuccess({
      timestamp: new Date().toISOString(),
      fiiNet: validation.fiiNet,
      diiNet: validation.diiNet,
      combinedNet: validation.combinedNet,
      status: validation.status,
      note: validation.note
    }, 200);
  } catch (error) {
    logRouteError("GET /api/institutional-flows/latest", error);
    return apiError("Failed to fetch institutional flow data", 500);
  }
}
