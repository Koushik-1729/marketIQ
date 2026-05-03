import { prisma } from "@/lib/prisma";
import type { AlertLogRepository } from "@/domain/ports/alert-log-repository";

export class PostgresAlertLogRepository implements AlertLogRepository {
  async exists(cardId: string, userId: string, channel: string): Promise<boolean> {
    const count = await prisma.alertLog.count({
      where: { cardId, userId, channel }
    });
    return count > 0;
  }

  async create(input: { cardId: string; userId: string; channel: string }): Promise<void> {
    try {
      await prisma.alertLog.create({ data: input });
    } catch (error: any) {
      // Unique constraint violation — already sent, safe to ignore
      if (error?.code === "P2002") return;
      throw error;
    }
  }
}
