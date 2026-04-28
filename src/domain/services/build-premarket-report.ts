import type { RankedSignal } from "@/domain/services/rank-report-signals";
import type { TopEarningsEventReportItem, SectorMomentumReportItem, InstitutionalFlowReportItem, DealReportItem } from "@/application/dto/latest-report";

export type PremarketReportSections = {
  marketMood: string;
  topHighConfidenceSignals: RankedSignal[];
  watchlistAlerts: RankedSignal[];
  riskAlerts: RankedSignal[];
  earningsEvents: TopEarningsEventReportItem[];
  sectorMomentum: SectorMomentumReportItem[];
  institutionalFlow: InstitutionalFlowReportItem;
  recentDeals: DealReportItem[];
};

export function buildPremarketReport(
  marketMood: string,
  rankedSignals: RankedSignal[],
  watchlistTickers: string[],
  earningsEvents: TopEarningsEventReportItem[],
  sectorMomentum: SectorMomentumReportItem[],
  institutionalFlow: InstitutionalFlowReportItem,
  recentDeals: DealReportItem[]
): PremarketReportSections {
  
  const riskAlerts: RankedSignal[] = [];
  const topHighConfidenceSignals: RankedSignal[] = [];
  const watchlistAlerts: RankedSignal[] = [];

  // Separate signals cleanly to ensure they only appear in one main section
  // Priority: RISK_ALERT -> WATCHLIST -> TOP
  
  for (const signal of rankedSignals) {
    if (signal.priorityLevel === "RISK_ALERT") {
      if (riskAlerts.length < 5) {
        riskAlerts.push(signal);
      }
      continue;
    }

    if (watchlistTickers.includes(signal.ticker)) {
      watchlistAlerts.push(signal);
      continue;
    }

    if (signal.priorityLevel === "CRITICAL" || signal.priorityLevel === "HIGH") {
      if (topHighConfidenceSignals.length < 5) {
        topHighConfidenceSignals.push(signal);
      }
    }
  }

  return {
    marketMood,
    topHighConfidenceSignals,
    watchlistAlerts,
    riskAlerts,
    earningsEvents,
    sectorMomentum,
    institutionalFlow,
    recentDeals
  };
}
