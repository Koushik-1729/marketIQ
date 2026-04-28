import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { FeedbackOutcome } from "@/domain/entities/feedback-outcome";

export async function saveFeedback(outcome: FeedbackOutcome) {
  return engineRuntime.feedbackRepository.saveOutcome(outcome);
}
