import { prisma } from "../../lib/prisma";
import { formatEarningsPulse } from "../../domain/services/format-earnings-pulse";
import { TelegramClient } from "../../adapters/outbound/telegram/telegram-client";

export async function sendEarningsPulse(ticker: string) {
  const event = await prisma.earningsEvent.findFirst({
    where: { ticker },
    orderBy: { earningsDate: "desc" }
  });

  if (!event) {
    throw new Error(`No earnings event found for ticker: ${ticker}`);
  }

  // Map Prisma record to domain entity
  const domainEvent = {
    ...event,
    earningsDate: event.earningsDate.toISOString(),
    createdAt: event.createdAt.toISOString()
  } as any;

  const message = formatEarningsPulse(domainEvent);
  
  const users = await prisma.user.findMany({
    where: { telegramChatId: { not: null } }
  });

  const client = new TelegramClient();
  let sentCount = 0;

  for (const user of users) {
    if (user.telegramChatId) {
      const success = await client.sendMessage(user.telegramChatId, message);
      if (success) sentCount++;
    }
  }

  return { success: true, sentCount };
}
