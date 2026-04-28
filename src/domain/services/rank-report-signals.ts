import type { EngineSignal } from "@/domain/entities/engine-signal";

export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "RISK_ALERT";

export type RankedSignal = EngineSignal & {
  priorityLevel: PriorityLevel;
  confirmationCount: number;
};

function getConfirmationCount(signal: EngineSignal): number {
  let count = 0;
  if (signal.confirmationStatus === "CONFIRMED") count++;
  if (signal.sectorMomentumStatus === "STRONG") count++;
  if (signal.institutionalFlowStatus === "FII_DII_BOTH_BUYING" || signal.institutionalFlowStatus === "FII_SELLING_DII_BUYING") count++;
  if (signal.dealValidationStatus === "SMART_BUYING") count++;
  return count;
}

function assignPriority(signal: EngineSignal, confirmationCount: number): PriorityLevel {
  // Rule 1: Risk overrides everything
  const hasConflict = signal.conflictFlag || signal.riskLevel === "high";
  const hasPriceContradiction = signal.confirmationStatus === "CONTRADICTION";
  const hasSmartSelling = signal.dealValidationStatus === "SMART_SELLING";
  const hasInstitutionalSelling = signal.institutionalFlowStatus === "FII_DII_BOTH_SELLING";

  if (hasConflict || hasPriceContradiction || hasSmartSelling || hasInstitutionalSelling) {
    return "RISK_ALERT";
  }

  // Rule: CRITICAL if score > 85, price/volume confirmed, sector supportive, no contradiction
  if (
    signal.finalScore > 85 &&
    signal.confirmationStatus === "CONFIRMED" &&
    signal.sectorMomentumStatus === "STRONG"
  ) {
    return "CRITICAL";
  }

  // Rule: HIGH if score > 50 (Lowered from 70 for MVP verification of real news)
  if (signal.finalScore > 50) {
    return "HIGH";
  }

  return "LOW";
}

export function rankReportSignals(signals: EngineSignal[]): RankedSignal[] {
  return signals
    .map(signal => {
      const confirmationCount = getConfirmationCount(signal);
      const priorityLevel = assignPriority(signal, confirmationCount);
      return { ...signal, priorityLevel, confirmationCount };
    })
    .sort((a, b) => {
      // 1. Sort by risk vs non-risk (we usually separate risk later, but here we rank by finalScore anyway)
      // Actually, ranking purely by final score and freshness is standard.
      if (a.finalScore !== b.finalScore) {
        return b.finalScore - a.finalScore;
      }
      return a.freshnessMinutes - b.freshnessMinutes;
    });
}
