import type { EngineSignal } from "@/domain/entities/engine-signal";

export type EngineDashboardData = {
  marketMood: string;
  giftNifty: string;
  fiiDii: string;
  topSignals: EngineSignal[];
  watchlistSignals: EngineSignal[];
  riskSignals: EngineSignal[];
  pipelineStats: {
    rawDocuments: number;
    normalizedDocuments: number;
    extractedEvents: number;
    classifiedEvents: number;
    eventClusters: number;
    finalSignals: number;
  };
  feedbackLearning: {
    positiveHitRate: number;
    negativeFalseAlarmRate: number;
    engagementRate: number;
    recommendation: string;
  };
};
