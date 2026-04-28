import type { EarningsEvent } from "@/domain/entities/earnings-event";
import type { EventCluster } from "@/domain/entities/event-cluster";

export type EarningsSignalScore = {
  scoreAdjustment: number;
  confidenceFloor: number;
  summary: string;
};

function buildSummary(cluster: EventCluster, earningsEvent: EarningsEvent) {
  const parts = [`${earningsEvent.fiscalQuarter} results announced`];

  if (earningsEvent.epsSurprisePercent !== null) {
    parts.push(
      `${earningsEvent.epsSurprisePercent >= 0 ? "EPS beat" : "EPS miss"} ${Math.abs(
        earningsEvent.epsSurprisePercent
      ).toFixed(1)}%`
    );
  } else if (earningsEvent.actualEPS !== null) {
    parts.push(
      `${earningsEvent.actualEPS >= 0 ? "positive EPS print" : "negative EPS print"}`
    );
  }

  if (earningsEvent.revenueSurprisePercent !== null) {
    parts.push(
      `${earningsEvent.revenueSurprisePercent >= 0 ? "revenue beat" : "revenue miss"} ${Math.abs(
        earningsEvent.revenueSurprisePercent
      ).toFixed(1)}%`
    );
  } else if (earningsEvent.actualRevenue !== null) {
    parts.push("revenue disclosed");
  }

  if (earningsEvent.hasGuidance && earningsEvent.guidanceTone !== "UNKNOWN") {
    parts.push(`${earningsEvent.guidanceTone.toLowerCase()} guidance`);
  }

  if (cluster.corroborationCount >= 2) {
    parts.push("multiple sources confirmed");
  }

  return parts.join(" · ");
}

export function scoreEarningsSignal(params: {
  cluster: EventCluster;
  earningsEvent: EarningsEvent;
}): EarningsSignalScore {
  const { cluster, earningsEvent } = params;
  const summaryText = `${cluster.summary} ${cluster.company}`.toLowerCase();

  let scoreAdjustment = 40;

  if (earningsEvent.actualEPS !== null) {
    scoreAdjustment += earningsEvent.actualEPS >= 0 ? 20 : -20;
  }

  if (
    (earningsEvent.actualRevenue !== null &&
      earningsEvent.estimatedRevenue !== null &&
      earningsEvent.actualRevenue > earningsEvent.estimatedRevenue) ||
    /revenue grew|growth in revenue|revenue growth|grew to/.test(summaryText)
  ) {
    scoreAdjustment += 15;
  }

  if (/record profit/.test(summaryText)) {
    scoreAdjustment += 20;
  }

  if (/decline|loss/.test(summaryText)) {
    scoreAdjustment -= 20;
  }

  if (cluster.corroborationCount >= 2) {
    scoreAdjustment += 15;
  }

  scoreAdjustment += 20;

  if (earningsEvent.guidanceTone === "POSITIVE") {
    scoreAdjustment += 10;
  } else if (earningsEvent.guidanceTone === "NEGATIVE") {
    scoreAdjustment -= 10;
  }

  return {
    scoreAdjustment,
    confidenceFloor: 0.88,
    summary: buildSummary(cluster, earningsEvent)
  };
}
