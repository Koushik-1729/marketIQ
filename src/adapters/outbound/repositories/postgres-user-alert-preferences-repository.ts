import { prisma } from "@/lib/prisma";
import type {
  AlertableUser,
  UserAlertPreferencesRepository
} from "@/domain/ports/user-alert-preferences-repository";

export class PostgresUserAlertPreferencesRepository
  implements UserAlertPreferencesRepository
{
  async findTelegramEnabledUsers(): Promise<AlertableUser[]> {
    const users = await prisma.user.findMany({
      where: {
        telegramEnabled: true,
        telegramChatId: { not: null }
      },
      select: {
        id: true,
        telegramChatId: true,
        telegramEnabled: true,
        globalAlerts: true
      }
    });

    // telegramChatId is guaranteed non-null by the where clause
    return users.map((u) => ({
      id: u.id,
      telegramChatId: u.telegramChatId!,
      telegramEnabled: u.telegramEnabled,
      globalAlerts: u.globalAlerts
    }));
  }

  async findWatchlistTickers(userId: string): Promise<string[]> {
    const tickers = await prisma.watchlistTicker.findMany({
      where: {
        watchlist: { userId }
      },
      select: { ticker: true }
    });

    return [...new Set(tickers.map((t) => t.ticker))];
  }
}
