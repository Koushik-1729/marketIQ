import type { FeedbackOutcome } from "@/domain/entities/feedback-outcome";
import type { FeedbackRepositoryPort } from "@/domain/ports/feedback-repository";

export class InMemoryFeedbackRepositoryAdapter implements FeedbackRepositoryPort {
  private outcomes: FeedbackOutcome[] = [
    {
      signalId: "sig_cluster_RELIANCE_order_win_1",
      horizon: "1d" as const,
      priceMovePct: 2.8,
      volumeMovePct: 34,
      userAction: "useful" as const
    },
    {
      signalId: "sig_cluster_TATAMOTORS_sentiment_spike_1",
      horizon: "1d" as const,
      priceMovePct: 0.2,
      volumeMovePct: 12,
      userAction: "not_useful" as const
    },
    {
      signalId: "sig_cluster_HDFCBANK_insider_activity_1",
      horizon: "3d" as const,
      priceMovePct: -3.1,
      volumeMovePct: 28,
      userAction: "clicked" as const
    }
  ];

  async listOutcomes(): Promise<FeedbackOutcome[]> {
    return this.outcomes;
  }

  async saveOutcome(outcome: FeedbackOutcome): Promise<FeedbackOutcome> {
    this.outcomes.unshift(outcome);
    return outcome;
  }
}
