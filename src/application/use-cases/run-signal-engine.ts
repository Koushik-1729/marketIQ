import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { EngineDashboardData } from "@/application/dto/engine-dashboard-data";
import { ingestRawDocuments } from "@/application/use-cases/ingest-raw-documents";
import type { EarningsEvent } from "@/domain/entities/earnings-event";
import { classifyEvents } from "@/domain/services/classify-event";
import { clusterEvents } from "@/domain/services/cluster-events";
import { detectEarningsEvent } from "@/domain/services/detect-earnings-event";
import { detectConflict } from "@/domain/services/detect-conflicts";
import { extractEvents } from "@/domain/services/extract-events";
import { filterSignals } from "@/domain/services/filter-signals";
import { learnFromFeedback } from "@/domain/services/learn-from-feedback";
import { normalizeDocuments } from "@/domain/services/normalize-documents";
import { parseEarningsMetrics } from "@/domain/services/parse-earnings-metrics";
import { rankSignalsForWatchlist } from "@/domain/services/personalize-signals";
import { scoreSignal } from "@/domain/services/score-signal";
import { getSectorForTicker } from "@/domain/data/sector-map";
import type { SectorValidation } from "@/domain/services/validate-sector-momentum";
import { validateInstitutionalFlow } from "@/domain/services/validate-institutional-flow";
import { validateDealEvent } from "@/domain/services/validate-deal-event";
import { sendEarningsPulse } from "@/application/use-cases/send-earnings-pulse";
import { buildInsightCards } from "@/application/use-cases/build-insight-cards";

function buildEarningsEvents(rawDocuments: Awaited<ReturnType<typeof engineRuntime.rawDocumentRepository.findRecent>>) {
  return rawDocuments.flatMap<EarningsEvent>((document) => {
    const detected = detectEarningsEvent(document);
    if (!detected) {
      return [];
    }

    return [
      {
        ...detected,
        ...parseEarningsMetrics(document)
      }
    ];
  });
}

export async function runSignalEngine(performIngestion = true): Promise<EngineDashboardData> {
  if (performIngestion) {
    await ingestRawDocuments();
  }

  const rawDocuments = await engineRuntime.rawDocumentRepository.findRecent(250);
  const earningsEvents = buildEarningsEvents(rawDocuments);
  const savedEarnings = await engineRuntime.earningsEventRepository.saveMany(earningsEvents);
  
  // Trigger pulses for high-impact results
  for (const earnings of savedEarnings) {
    if (earnings.actualEPS !== null || earnings.actualRevenue !== null) {
      await sendEarningsPulse(earnings.ticker).catch(err => console.warn(`Failed to send pulse for ${earnings.ticker}`, err));
    }
  }

  const normalizedDocuments = normalizeDocuments(rawDocuments);
  const extractedEvents = extractEvents(rawDocuments, normalizedDocuments);
  const classifiedEvents = classifyEvents(extractedEvents);
  const eventClusters = clusterEvents(classifiedEvents);
  const marketContext = await engineRuntime.marketContextRepository.getLatest();
  const priceValidations = await engineRuntime.priceValidationRepository.getByTickers(
    eventClusters.map((cluster) => cluster.ticker)
  );
  const latestEarningsByTicker = await engineRuntime.earningsEventRepository.findLatestByTickers(
    eventClusters.map((cluster) => cluster.ticker)
  );
  const latestSectorBars = await engineRuntime.sectorBarRepository.getLatestForAllSectors();
  
  const latestFlows = await engineRuntime.institutionalFlowRepository.findLatest("EQUITY");
  const flowValidation = validateInstitutionalFlow(latestFlows);

  // Get recent deals for all event cluster tickers - PROCESS SEQUENTIALLY to respect connection pool limit
  const recentDealsResults: Awaited<ReturnType<typeof engineRuntime.dealEventRepository.findRecentByTicker>>[] = [];
  for (const cluster of eventClusters) {
    const deals = await engineRuntime.dealEventRepository.findRecentByTicker(cluster.ticker, 7);
    recentDealsResults.push(deals);
  }

  const scoredSignals = eventClusters.map((cluster, index) => {
    const priceValidation = priceValidations.find(
      (item) => item.ticker === cluster.ticker
    );
    const earningsEvent = latestEarningsByTicker.find(
      (item) => item.ticker === cluster.ticker && cluster.eventType === "earnings"
    );
    const conflict = detectConflict(cluster, priceValidation);
    
    const mappedSector = getSectorForTicker(cluster.ticker) ?? "Unknown";
    const sectorBar = latestSectorBars.find(b => b.sector === mappedSector);
    let sectorValidation: SectorValidation | undefined = undefined;
    
    if (sectorBar) {
      const rs = sectorBar.relativeStrength;
      let status: SectorValidation["status"] = "NEUTRAL";
      let note = `Sector is moving with Nifty (${rs > 0 ? "+" : ""}${rs.toFixed(2)}% RS)`;

      if (rs > 0.5) {
        status = "STRONG";
        note = `${mappedSector} sector is outperforming Nifty by ${rs.toFixed(2)}%, supporting positive signals.`;
      } else if (rs < -0.5) {
        status = "WEAK";
        note = `${mappedSector} sector is underperforming Nifty by ${Math.abs(rs).toFixed(2)}%, supporting negative signals.`;
      }

      sectorValidation = {
        sector: mappedSector,
        sectorReturn: sectorBar.changePercent,
        niftyReturn: sectorBar.changePercent - rs,
        relativeStrength: rs,
        momentumScore: sectorBar.momentumScore,
        status,
        note
      };
    }

    const recentDealsForTicker = recentDealsResults[index];
    const dealValidation = validateDealEvent(cluster.ticker, recentDealsForTicker);

    return scoreSignal({
      cluster,
      context: marketContext,
      priceValidation,
      sectorValidation,
      flowValidation,
      dealValidation,
      conflictPenalty: conflict.penalty,
      conflictReason: conflict.conflictReason,
      conflictFlag: conflict.conflictFlag,
      earningsEvent
    });
  });

  const finalSignals = filterSignals(scoredSignals);
  await engineRuntime.signalRepository.saveMany(finalSignals);
  await buildInsightCards(finalSignals);
  const watchlist = await engineRuntime.watchlistRepository.getPrimaryWatchlist();
  const rankedWatchlistSignals = rankSignalsForWatchlist(finalSignals, {
    tickers: watchlist.tickers,
    sectors: watchlist.sectors,
    themes: watchlist.themes
  }).map((entry) => entry.signal);
  const feedbackLearning = learnFromFeedback(
    await engineRuntime.feedbackRepository.listOutcomes()
  );

  return {
    marketMood: "Constructive with selective risk pockets",
    giftNifty: `${marketContext.giftNiftyChange > 0 ? "+" : ""}${marketContext.giftNiftyChange}`,
    fiiDii: `FII: ${marketContext.fiiFlowCr} Cr | DII: +${marketContext.diiFlowCr} Cr`,
    topSignals: finalSignals,
    watchlistSignals: rankedWatchlistSignals.slice(0, 3),
    riskSignals: finalSignals.filter((signal) => signal.riskLevel === "high"),
    pipelineStats: {
      rawDocuments: rawDocuments.length,
      normalizedDocuments: normalizedDocuments.filter((item) => !item.isDuplicate).length,
      extractedEvents: extractedEvents.length,
      classifiedEvents: classifiedEvents.length,
      eventClusters: eventClusters.length,
      finalSignals: finalSignals.length
    },
    feedbackLearning
  };
}
