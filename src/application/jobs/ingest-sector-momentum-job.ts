import { engineRuntime } from "@/application/runtime/engine-runtime";
import { fetchSectorData, fetchNifty50Data } from "@/adapters/inbound/sources/sector-market-data-source";
import { validateSectorMomentum } from "@/domain/services/validate-sector-momentum";
import { SECTOR_INDEX_MAPPING } from "@/domain/data/sector-map";
import type { SectorBar } from "@/domain/ports/sector-bar-repository";

export async function ingestSectorMomentumJob() {
  console.info("[ingest-sector-momentum-job] Starting sector momentum ingestion");

  const job = await engineRuntime.jobRunRepository.createRunning("ingest-sector-momentum");
  const runId = job.id;

  try {
    const niftyBars = await fetchNifty50Data();
    if (niftyBars.length === 0) {
      throw new Error("Failed to fetch Nifty 50 baseline data");
    }

    const sectors = Object.keys(SECTOR_INDEX_MAPPING);
    const allSectorBars: SectorBar[] = [];

    for (const sector of sectors) {
      const bars = await fetchSectorData(sector);
      if (bars.length === 0) continue;

      const validation = validateSectorMomentum(sector, bars, niftyBars);
      
      const latestBar = { ...bars[0] };
      latestBar.relativeStrength = validation.relativeStrength;
      latestBar.momentumScore = validation.momentumScore;
      allSectorBars.push(latestBar);
    }

    if (allSectorBars.length > 0) {
      await engineRuntime.sectorBarRepository.saveMany(allSectorBars);
      console.info(`[ingest-sector-momentum-job] Saved ${allSectorBars.length} latest sector bars`);
    }

    await engineRuntime.jobRunRepository.markSuccess(runId);
  } catch (error) {
    console.error("[ingest-sector-momentum-job] Failed", error);
    await engineRuntime.jobRunRepository.markFailed(runId, error instanceof Error ? error.message : "Unknown error");
  }
}
