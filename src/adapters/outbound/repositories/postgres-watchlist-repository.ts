import type { Watchlist } from "@/domain/entities/watchlist";
import type { WatchlistRepositoryPort } from "@/domain/ports/watchlist-repository";
import { prisma } from "@/lib/prisma";

export class PostgresWatchlistRepository implements WatchlistRepositoryPort {
  async getPrimaryWatchlist(): Promise<Watchlist> {
    const watchlist = await prisma.watchlist.findFirst({
      orderBy: { createdAt: "asc" },
      include: {
        tickers: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!watchlist) {
      return {
        userId: "unknown",
        tickers: [],
        sectors: [],
        themes: [],
        riskTolerance: "medium"
      };
    }

    return {
      userId: watchlist.userId,
      tickers: watchlist.tickers.map((item) => item.ticker),
      sectors: watchlist.sectors,
      themes: watchlist.themes,
      riskTolerance: watchlist.riskTolerance as Watchlist["riskTolerance"]
    };
  }

  async addTickersToPrimaryWatchlist(tickers: string[]): Promise<Watchlist> {
    const existing = await prisma.watchlist.findFirst({
      orderBy: { createdAt: "asc" },
      include: { tickers: true }
    });

    if (!existing) {
      const user = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" }
      });

      if (!user) {
        throw new Error("Primary user not found");
      }

      await prisma.watchlist.create({
        data: {
          userId: user.id,
          name: "Primary Watchlist",
          riskTolerance: "medium",
          tickers: {
            create: tickers.map((ticker) => ({ ticker }))
          }
        }
      });
    } else {
      await prisma.watchlistTicker.createMany({
        data: tickers.map((ticker) => ({
          watchlistId: existing.id,
          ticker
        })),
        skipDuplicates: true
      });
    }

    return this.getPrimaryWatchlist();
  }
}
