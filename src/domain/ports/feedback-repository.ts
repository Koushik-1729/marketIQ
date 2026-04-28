import type { FeedbackOutcome } from "@/domain/entities/feedback-outcome";

export interface FeedbackRepositoryPort {
  listOutcomes(): Promise<FeedbackOutcome[]>;
  saveOutcome(outcome: FeedbackOutcome): Promise<FeedbackOutcome>;
}
