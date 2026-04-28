import type { EngineSignal } from "@/domain/entities/engine-signal";
import type { SignalExplanation } from "@/domain/entities/signal-explanation";

export function explainSignal(signal: EngineSignal): SignalExplanation {
  const reasons = [
    signal.eventSummary,
    `${signal.sourceCount} source${signal.sourceCount > 1 ? "s" : ""} confirmed the event`
  ];

  if (signal.priceValidation) {
    reasons.push(signal.priceValidation);
  }

  if (signal.conflictFlag && signal.conflictReason) {
    reasons.push(`Risk note: ${signal.conflictReason}`);
  }

  reasons.push(`Narrative state: ${signal.narrativeState}`);

  const watchItems =
    signal.riskLevel === "high"
      ? ["Track intraday weakness", "Watch fresh filings", "Check sector confirmation"]
      : ["Watch volume continuation", "Track sector strength", "Monitor follow-up coverage"];

  return {
    stock: signal.ticker,
    score: signal.finalScore,
    reasons,
    risk: signal.riskLevel,
    watchItems
  };
}
