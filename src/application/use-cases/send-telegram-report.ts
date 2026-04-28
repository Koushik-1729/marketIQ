import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { formatTelegramReport } from "@/domain/services/format-telegram-report";
import { telegramClient } from "@/adapters/outbound/telegram/telegram-client";
import { prisma } from "@/lib/prisma";

export async function sendTelegramReport(): Promise<{ success: boolean; sentCount: number }> {
  try {
    const report = await getLatestReport();
    const formattedText = formatTelegramReport(report);

    // Fetch users who have Telegram enabled
    const users = await prisma.user.findMany({
      where: {
        telegramEnabled: true,
        telegramChatId: { not: null }
      },
      select: { telegramChatId: true }
    });

    const chatIds = users.map((u) => u.telegramChatId as string);

    if (chatIds.length === 0) {
      console.info("[send-telegram-report] No users with Telegram enabled. Skipping send.");
      return { success: true, sentCount: 0 };
    }

    console.info(`[send-telegram-report] Sending report to ${chatIds.length} users.`);
    const sentCount = await telegramClient.sendBulk(chatIds, formattedText);

    return { success: true, sentCount };
  } catch (error) {
    console.error("[send-telegram-report] Failed to generate/send report:", error);
    // Don't throw so it doesn't crash the scheduler
    return { success: false, sentCount: 0 };
  }
}
