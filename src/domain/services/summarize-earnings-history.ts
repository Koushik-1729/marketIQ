import type { EarningsEvent } from "@/domain/entities/earnings-event";

type StreakDirection = "beat" | "miss" | "inline" | "unknown";

function compareMetric(actual: number | null, surprisePercent: number | null): StreakDirection {
  if (typeof surprisePercent === "number") {
    if (surprisePercent > 0) return "beat";
    if (surprisePercent < 0) return "miss";
    return "inline";
  }

  if (actual === null) {
    return "unknown";
  }

  return actual >= 0 ? "beat" : "miss";
}

function countStreak(events: EarningsEvent[], selector: (event: EarningsEvent) => StreakDirection) {
  if (events.length === 0) {
    return { direction: "unknown" as const, length: 0 };
  }

  const firstDirection = selector(events[0]);
  if (firstDirection === "unknown") {
    return { direction: "unknown" as const, length: 0 };
  }

  let length = 0;

  for (const event of events) {
    if (selector(event) !== firstDirection) {
      break;
    }

    length += 1;
  }

  return {
    direction: firstDirection,
    length
  };
}

function average(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => typeof value === "number");
  if (filtered.length === 0) {
    return null;
  }

  return Number((filtered.reduce((sum, value) => sum + value, 0) / filtered.length).toFixed(2));
}

export function summarizeEarningsHistory(events: EarningsEvent[]) {
  const ordered = [...events].sort(
    (left, right) => new Date(right.earningsDate).getTime() - new Date(left.earningsDate).getTime()
  );

  const epsBeatCount = ordered.filter(
    event => compareMetric(event.actualEPS, event.epsSurprisePercent) === "beat"
  ).length;
  const epsMissCount = ordered.filter(
    event => compareMetric(event.actualEPS, event.epsSurprisePercent) === "miss"
  ).length;
  const revenueBeatCount = ordered.filter(
    event => compareMetric(event.actualRevenue, event.revenueSurprisePercent) === "beat"
  ).length;
  const revenueMissCount = ordered.filter(
    event => compareMetric(event.actualRevenue, event.revenueSurprisePercent) === "miss"
  ).length;

  const guidanceCounts = ordered.reduce(
    (acc, event) => {
      if (!event.hasGuidance) {
        acc.none += 1;
        return acc;
      }

      if (event.guidanceTone === "POSITIVE") acc.positive += 1;
      else if (event.guidanceTone === "NEGATIVE") acc.negative += 1;
      else acc.neutral += 1;

      return acc;
    },
    { positive: 0, neutral: 0, negative: 0, none: 0 }
  );

  return {
    totalEvents: ordered.length,
    epsBeatRate:
      ordered.length > 0 ? Number(((epsBeatCount / ordered.length) * 100).toFixed(1)) : 0,
    revenueBeatRate:
      ordered.length > 0 ? Number(((revenueBeatCount / ordered.length) * 100).toFixed(1)) : 0,
    epsBeatCount,
    epsMissCount,
    revenueBeatCount,
    revenueMissCount,
    epsStreak: countStreak(ordered, event => compareMetric(event.actualEPS, event.epsSurprisePercent)),
    revenueStreak: countStreak(ordered, event =>
      compareMetric(event.actualRevenue, event.revenueSurprisePercent)
    ),
    averageEpsSurprise: average(ordered.map(event => event.epsSurprisePercent)),
    averageRevenueSurprise: average(ordered.map(event => event.revenueSurprisePercent)),
    guidanceCounts
  };
}
