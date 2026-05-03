import type { RankedSignal } from "@/domain/services/rank-report-signals";
import type { GuidanceTone } from "@/domain/entities/earnings-event";
import type { EngineSignal } from "@/domain/entities/engine-signal";

export type TopEarningsEventReportItem = {
  ticker: string;
  companyName: string;
  fiscalQuarter: string;
  fiscalYear: number;
  score: number;
  summary: string;
  source: string;
  guidanceTone: GuidanceTone;
};

export type PriceValidatedSignalDTO = {
  ticker: string;
  score: number;
  priceMove: string;
  volumeRatio: string;
  confirmation: string;
  explanation: string;
};

export type SectorMomentumReportItem = {
  sector: string;
  status: string;
};

export type InstitutionalFlowReportItem = {
  fiiNet: number;
  diiNet: number;
  combinedNet: number;
  status: string;
};

export type DealReportItem = {
  ticker: string;
  dealType: string;
  buyer: string;
  seller: string;
  value: number;
  signalImpact: string;
};

export type LatestReport = {
  generatedAt: string;
  dataStatus: "live" | "degraded";
  marketMood: string;
  giftNifty: string;
  fiiDii: string;
  topSignals: EngineSignal[];
  riskSignals: EngineSignal[];
  groupedSignals: {
    highAttention: EngineSignal[];
    riskEvents: EngineSignal[];
    watchlistFocus: EngineSignal[];
  };
  priceValidatedSignals: PriceValidatedSignalDTO[];

  // Intelligence Layer Fields
  topHighConfidenceSignals: RankedSignal[];
  watchlistAlerts: RankedSignal[];
  riskAlerts: RankedSignal[];
  earningsEvents: TopEarningsEventReportItem[];
  sectorMomentum: SectorMomentumReportItem[];
  institutionalFlow: InstitutionalFlowReportItem;
  recentDeals: DealReportItem[];
};
