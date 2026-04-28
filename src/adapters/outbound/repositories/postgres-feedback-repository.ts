import type { FeedbackOutcome } from "@/domain/entities/feedback-outcome";
import type { FeedbackRepositoryPort } from "@/domain/ports/feedback-repository";
import { prisma } from "@/lib/prisma";

export class PostgresFeedbackRepository implements FeedbackRepositoryPort {
  async listOutcomes(): Promise<FeedbackOutcome[]> {
    const records = await prisma.feedbackOutcome.findMany({
      orderBy: { evaluatedAt: "desc" }
    });

    return records.map((record) => ({
      signalId: record.signalId,
      horizon: (record.horizon as FeedbackOutcome["horizon"]) ?? "1d",
      priceMovePct: record.priceChange,
      volumeMovePct: record.volumeChange ?? 0,
      userAction:
        (record.userAction as FeedbackOutcome["userAction"]) ??
        (record.outcome === "UP" ? "useful" : record.outcome === "DOWN" ? "clicked" : "ignored")
    }));
  }

  async saveOutcome(outcome: FeedbackOutcome): Promise<FeedbackOutcome> {
    const direction =
      outcome.userAction === "useful"
        ? "UP"
        : outcome.userAction === "clicked"
          ? "DOWN"
          : "NEUTRAL";

    await prisma.feedbackOutcome.create({
      data: {
        signalId: outcome.signalId,
        outcome: direction,
        priceChange: outcome.priceMovePct,
        evaluatedAt: new Date(),
        horizon: outcome.horizon,
        volumeChange: outcome.volumeMovePct,
        userAction: outcome.userAction
      }
    });

    return outcome;
  }
}
