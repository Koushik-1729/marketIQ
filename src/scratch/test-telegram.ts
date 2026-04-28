import { prisma } from "../../src/lib/prisma";
import { sendTelegramReport } from "../../src/application/use-cases/send-telegram-report";
import { runSignalEngineJob } from "../../src/application/jobs/run-signal-engine-job";

async function run() {
  console.log("Registering Chat ID...");
  const chatId = "5659960692"; // Extracted from your 'Hi' message!

  let user = await prisma.user.findFirst();
  
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: "admin@marketengine.local",
        telegramChatId: chatId,
        telegramEnabled: true
      }
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        telegramChatId: chatId,
        telegramEnabled: true
      }
    });
  }

  console.log(`User linked to Telegram: ${user.telegramChatId}`);
  
  // Skip signal engine locally due to Prisma connection limit in scripts. 
  // We already ingested the live FII/DII and Deals data.
  // await runSignalEngineJob({ performIngestion: false });

  console.log("Generating and sending Pre-Market Report...");

  const result = await sendTelegramReport();
  
  if (result.success) {
    console.log(`Success! Sent report to ${result.sentCount} users.`);
  } else {
    console.log("Failed to send report.");
  }
  
  await prisma.$disconnect();
}

run().catch(console.error).finally(() => process.exit(0));
