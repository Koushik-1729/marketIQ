import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const telegramChatId = process.env.TEST_TELEGRAM_CHAT_ID || "PUT_YOUR_CHAT_ID_HERE";

  const user = await prisma.user.upsert({
    where: { email: "test@marketiq.dev" },
    update: {
      telegramEnabled: true,
      telegramChatId,
      globalAlerts: true,
    },
    create: {
      email: "test@marketiq.dev",
      telegramEnabled: true,
      telegramChatId,
      globalAlerts: true,
    },
  });

  const watchlist = await prisma.watchlist.upsert({
    where: {
      id: "default-test-watchlist",
    },
    update: {
      name: "Default",
      userId: user.id,
    },
    create: {
      id: "default-test-watchlist",
      userId: user.id,
      name: "Default",
      riskTolerance: "medium",
      sectors: ["FMCG", "Auto", "Capital Goods"],
      themes: ["Earnings", "Orders"],
    },
  });

  const tickers = ["RELIANCE", "HINDUNILVR", "BAJAJ-AUTO", "HEG"];

  for (const ticker of tickers) {
    await prisma.watchlistTicker.upsert({
      where: {
        watchlistId_ticker: {
          watchlistId: watchlist.id,
          ticker,
        },
      },
      update: {},
      create: {
        watchlistId: watchlist.id,
        ticker,
      },
    });
  }

  console.log("✅ Test user + watchlist created");
  console.log({ userId: user.id, watchlistId: watchlist.id, telegramChatId });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());