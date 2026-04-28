import { saveFeedback } from "@/application/use-cases/save-feedback";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/api-schemas";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = feedbackSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid feedback payload", 400, parsed.error.flatten());
    }

    const { signalId, outcome, priceChange, horizon, feedbackType, userId } = parsed.data;

    // Handle new human feedback (Telegram)
    if (feedbackType) {
      const savedSignalFeedback = await prisma.signalFeedback.create({
        data: {
          signalId,
          userId,
          feedbackType
        }
      });
      return apiSuccess({ type: "human", data: savedSignalFeedback }, 201);
    }

    // Handle old ML feedback
    if (outcome && priceChange !== undefined) {
      const savedMLFeedback = await saveFeedback({
        signalId,
        horizon: horizon ?? "1d",
        priceMovePct: priceChange,
        volumeMovePct: 0,
        userAction:
          outcome === "UP"
            ? "useful"
            : outcome === "DOWN"
              ? "clicked"
              : "ignored"
      });
      return apiSuccess({ type: "ml", data: savedMLFeedback }, 201);
    }

    return apiError("Invalid feedback payload. Must provide either ML outcome or human feedbackType.", 400);
  } catch (error) {
    logRouteError("POST /api/feedback", error);
    return apiError("Failed to save feedback", 500);
  }
}
