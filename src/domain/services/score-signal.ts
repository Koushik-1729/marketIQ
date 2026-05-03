import type { EarningsEvent } from "@/domain/entities/earnings-event";
import type { EngineSignal } from "@/domain/entities/engine-signal";
import type { EventCluster } from "@/domain/entities/event-cluster";
import type { MarketContext } from "@/domain/entities/market-context";
import type { PriceValidation } from "@/domain/entities/price-validation";
import type { SectorValidation } from "@/domain/services/validate-sector-momentum";
import type { FlowValidation } from "@/domain/services/validate-institutional-flow";
import type { DealValidation } from "@/domain/services/validate-deal-event";
import { explainSignal } from "@/domain/services/explain-signal";
import { scoreEarningsSignal } from "@/domain/services/score-earnings-signal";

function getMarketMultiplier(context: MarketContext, sector: string) {
  const trendBase =
    context.niftyTrend === "bull"
      ? 1.08
      : context.niftyTrend === "bear"
        ? 0.9
        : 1;
  const sectorTilt = 1 + (context.sectorStrength[sector] ?? 0) / 100;

  return trendBase * sectorTilt;
}

function getSentimentScore(sentiment: EventCluster["sentiment"]) {
  switch (sentiment) {
    case "positive":
      return 12;
    case "negative":
      return 10;
    case "mixed":
      return 4;
    default:
      return 2;
  }
}

function getTimeDecay(lastSeenAt: string) {
  const eventTimestamp = new Date(lastSeenAt).getTime();
  const currentTimestamp = new Date("2026-04-26T08:30:00+05:30").getTime();
  const hours = Math.max(0, (currentTimestamp - eventTimestamp) / (1000 * 60 * 60));

  return Math.exp(-0.1 * hours);
}

function getPriceVolumeBonus(validation: PriceValidation | undefined) {
  if (!validation) return 0;

  let score = 0;

  switch (validation.confirmationStatus) {
    case "CONFIRMED":
      score += 25;
      break;
    case "WEAK":
      score -= 15;
      break;
    case "CONTRADICTION":
      score -= 20;
      break;
    case "NEUTRAL":
    case "NO_DATA":
    default:
      break;
  }

  if (validation.momentumPersistence) {
    score += 10;
  }

  // Adding bounded volume score as well
  if (validation.volumeScore && validation.volumeScore > 0) {
    score += Math.min(10, Math.round(validation.volumeScore * 5));
  }

  return score;
}

function getSectorMomentumBonus(
  sentiment: EventCluster["sentiment"],
  validation: SectorValidation | undefined
) {
  if (!validation || validation.status === "NO_DATA") return 0;

  if (sentiment === "positive") {
    if (validation.status === "STRONG") return 15;
    if (validation.status === "WEAK") return -10;
  } else if (sentiment === "negative") {
    if (validation.status === "WEAK") return 10;
    if (validation.status === "STRONG") return -10;
  }
  return 0;
}

function getFlowBonus(sentiment: EventCluster["sentiment"], flow: FlowValidation | undefined) {
  if (!flow || flow.status === "NO_DATA") return 0;

  if (sentiment === "positive") {
    if (flow.status === "FII_DII_BOTH_BUYING") return 10;
    if (flow.status === "FII_DII_BOTH_SELLING") return -10;
    if (flow.status === "FII_SELLING_DII_BUYING") return -5;
  } else if (sentiment === "negative") {
    if (flow.status === "FII_DII_BOTH_SELLING") return 10;
  }

  return 0;
}

function getDealBonus(sentiment: EventCluster["sentiment"], deal: DealValidation | undefined) {
  if (!deal || deal.status === "NO_DATA" || deal.status === "INSTITUTIONAL_ROTATION") return 0;

  if (sentiment === "positive") {
    if (deal.status === "SMART_BUYING") return 15;
    if (deal.status === "SMART_SELLING") return -15;
  } else if (sentiment === "negative") {
    if (deal.status === "SMART_SELLING") return 10;
  }

  return 0;
}

function getRiskLevel(cluster: EventCluster, conflictPenalty: number): EngineSignal["riskLevel"] {
  if (conflictPenalty >= 15 || cluster.sentiment === "negative") return "high";
  if (cluster.sentiment === "mixed") return "medium";
  return "low";
}

function getNarrativeState(cluster: EventCluster) {
  if (cluster.corroborationCount >= 3 && cluster.sentiment === "positive") {
    return "continuation";
  }

  if (cluster.sentiment === "mixed") {
    return "mixed/conflicting";
  }

  if (cluster.sentiment === "negative") {
    return "reversal";
  }

  return "emerging";
}

function getRiskLevelFromCluster(cluster: EventCluster, conflictPenalty: number) {
  if (cluster.rumorLikeCount > 0 || conflictPenalty >= 15 || cluster.sentiment === "negative") {
    return "high" as const;
  }

  if (cluster.sentiment === "mixed") {
    return "medium" as const;
  }

  return "low" as const;
}

export function scoreSignal(params: {
  cluster: EventCluster;
  context: MarketContext;
  priceValidation: PriceValidation | undefined;
  sectorValidation: SectorValidation | undefined;
  flowValidation: FlowValidation | undefined;
  dealValidation: DealValidation | undefined;
  conflictPenalty: number;
  conflictReason: string | null;
  conflictFlag: boolean;
  earningsEvent?: EarningsEvent;
}) {
  const { cluster, context, priceValidation, sectorValidation, flowValidation, dealValidation, conflictPenalty, conflictReason, conflictFlag } =
    params;
  const earningsOverlay =
    cluster.eventType === "earnings" && params.earningsEvent
      ? scoreEarningsSignal({
          cluster,
          earningsEvent: params.earningsEvent
        })
      : null;
  const timeDecay = getTimeDecay(cluster.lastSeenAt);
  const sourceConfirmationBonus = cluster.corroborationCount >= 3 ? 15 : cluster.corroborationCount * 4;
  const sourceCredibilityBonus = cluster.averageSourceCredibility * 1.5;
  const rumorPenalty = cluster.rumorLikeCount > 0 ? 10 : 0;

  const baseScoreBeforeDecay =
    cluster.eventWeight +
    getSentimentScore(cluster.sentiment) +
    cluster.confidence * 18 +
    sourceCredibilityBonus +
    sourceConfirmationBonus +
    (earningsOverlay?.scoreAdjustment ?? 0) +
    getPriceVolumeBonus(priceValidation) +
    getSectorMomentumBonus(cluster.sentiment, sectorValidation) +
    getFlowBonus(cluster.sentiment, flowValidation) +
    getDealBonus(cluster.sentiment, dealValidation) -
    rumorPenalty -
    conflictPenalty;
  const baseScore = baseScoreBeforeDecay * timeDecay;
  const adjustedScore = Math.max(0, Math.min(100, Math.round(baseScore)));
  const finalScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(adjustedScore * getMarketMultiplier(context, cluster.sector))
    )
  );
  const riskLevel = getRiskLevelFromCluster(cluster, conflictPenalty);

  const signal = {
    id: `sig_${cluster.id}`,
    ticker: cluster.ticker,
    company: cluster.company,
    sector: cluster.sector,
    eventType: cluster.eventType,
    eventSummary: earningsOverlay?.summary ?? cluster.summary,
    sentiment: cluster.sentiment,
    confidence: Number(
      Math.max(cluster.confidence, earningsOverlay?.confidenceFloor ?? 0).toFixed(2)
    ),
    impactScore: adjustedScore,
    finalScore,
    freshnessMinutes: Math.max(
      1,
      Math.round(
        (new Date("2026-04-26T08:30:00+05:30").getTime() -
          new Date(cluster.lastSeenAt).getTime()) /
          (1000 * 60)
      )
    ),
    sourceCount: cluster.sourceNames.length,
    riskLevel,
    conflictFlag,
    conflictReason,
    marketContext: `${context.niftyTrend} Nifty tone, VIX ${context.indiaVix}, ${context.globalCues} global cues`,
    priceValidation: priceValidation?.note ?? "No market confirmation yet",
    priceMove: priceValidation ? `${priceValidation.priceChangePercent > 0 ? "+" : ""}${priceValidation.priceChangePercent.toFixed(1)}%` : undefined,
    volumeRatio: priceValidation ? `${priceValidation.volumeRatio.toFixed(1)}x` : undefined,
    confirmationStatus: priceValidation?.confirmationStatus,
    sectorMomentumStatus: sectorValidation?.status,
    sectorMomentumNote: sectorValidation?.note,
    institutionalFlowStatus: flowValidation?.status,
    institutionalFlowNote: flowValidation?.note,
    dealValidationStatus: dealValidation?.status,
    dealValidationNote: dealValidation?.note,
    narrativeState: getNarrativeState(cluster),
    sources: cluster.sourceNames,
    sourceUrls: cluster.sourceUrls,
    pdfUrls: cluster.pdfUrls,
    metaLabel: finalScore >= 60 ? "keep" : finalScore >= 45 ? "downgrade" : "discard",
    explanation: {
      stock: cluster.ticker,
      score: finalScore,
      reasons: [],
      risk: riskLevel,
      watchItems: []
    }
  } satisfies EngineSignal;

  return {
    ...signal,
    explanation: explainSignal(signal)
  } satisfies EngineSignal;
}
