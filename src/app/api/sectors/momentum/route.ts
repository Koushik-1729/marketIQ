import { NextRequest } from "next/server";
import { engineRuntime } from "@/application/runtime/engine-runtime";
import { fetchSectorData, fetchNifty50Data } from "@/adapters/inbound/sources/sector-market-data-source";
import { validateSectorMomentum, SectorValidation } from "@/domain/services/validate-sector-momentum";
import { SECTOR_INDEX_MAPPING } from "@/domain/data/sector-map";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const niftyBars = await fetchNifty50Data();
    const sectors = Object.keys(SECTOR_INDEX_MAPPING);
    
    const results: SectorValidation[] = [];

    for (const sector of sectors) {
      const bars = await fetchSectorData(sector);
      const validation = validateSectorMomentum(sector, bars, niftyBars);
      results.push(validation);
    }

    return apiSuccess({
      timestamp: new Date().toISOString(),
      sectors: results.map((v) => ({
        sector: v.sector,
        changePercent: v.sectorReturn,
        relativeStrength: v.relativeStrength,
        momentumScore: v.momentumScore,
        status: v.status
      }))
    }, 200);

  } catch (error) {
    logRouteError("GET /api/sectors/momentum", error);
    return apiError("Failed to fetch sector momentum", 500);
  }
}
