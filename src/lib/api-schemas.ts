import { z } from "zod";

export const signalQuerySchema = z.object({
  ticker: z.string().trim().min(1).optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  sort: z.enum(["score_desc", "score_asc", "latest"]).default("latest")
});

export const addWatchlistTickersSchema = z.object({
  tickers: z.array(z.string().trim().min(1)).min(1).max(100)
});

export const feedbackSchema = z.object({
  signalId: z.string().trim().min(1),
  // Old ML feedback
  outcome: z.enum(["UP", "DOWN", "NEUTRAL"]).optional(),
  priceChange: z.number().optional(),
  horizon: z.enum(["1d", "3d", "7d"]).default("1d").optional(),
  // New Human feedback
  feedbackType: z.enum(["LIKE", "DISLIKE"]).optional(),
  userId: z.string().optional()
});
