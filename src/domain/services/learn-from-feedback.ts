import type { FeedbackOutcome } from "@/domain/entities/feedback-outcome";

export type FeedbackLearningSnapshot = {
  positiveHitRate: number;
  negativeFalseAlarmRate: number;
  engagementRate: number;
  recommendation: string;
};

export function learnFromFeedback(outcomes: FeedbackOutcome[]): FeedbackLearningSnapshot {
  if (outcomes.length === 0) {
    return {
      positiveHitRate: 0,
      negativeFalseAlarmRate: 0,
      engagementRate: 0,
      recommendation: "Collect outcome data before recalibrating weights."
    };
  }

  const positiveHits = outcomes.filter((outcome) => outcome.priceMovePct > 1.5).length;
  const falseAlarms = outcomes.filter((outcome) => outcome.userAction === "not_useful").length;
  const engaged = outcomes.filter((outcome) =>
    ["clicked", "saved", "useful"].includes(outcome.userAction)
  ).length;

  const positiveHitRate = positiveHits / outcomes.length;
  const negativeFalseAlarmRate = falseAlarms / outcomes.length;
  const engagementRate = engaged / outcomes.length;

  let recommendation = "Weights are stable.";

  if (negativeFalseAlarmRate > 0.35) {
    recommendation = "Reduce noisy sentiment and single-source signal weights.";
  } else if (positiveHitRate > 0.6) {
    recommendation = "Boost corroborated high-credibility event patterns slightly.";
  }

  return {
    positiveHitRate,
    negativeFalseAlarmRate,
    engagementRate,
    recommendation
  };
}
