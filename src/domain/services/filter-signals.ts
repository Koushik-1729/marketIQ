import type { EngineSignal } from "@/domain/entities/engine-signal";

export function filterSignals(signals: EngineSignal[]) {
  const keptSignals = signals.filter((signal) => signal.metaLabel !== "discard");

  if (keptSignals.length === 0) {
    return [];
  }

  const mean =
    keptSignals.reduce((total, signal) => total + signal.finalScore, 0) /
    keptSignals.length;

  return keptSignals
    .filter((signal) => signal.finalScore >= Math.max(50, mean - 5))
    .sort((left, right) => right.finalScore - left.finalScore);
}
