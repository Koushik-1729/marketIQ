import { prisma } from "../lib/prisma";
import { sendEarningsPulse } from "../application/use-cases/send-earnings-pulse";

async function run() {
  console.log("Creating Sample INDIACEM Earnings Data (Matching your image)...");
  
  await prisma.earningsEvent.upsert({
    where: {
      ticker_sourceUrl: {
        ticker: "INDIACEM",
        sourceUrl: "https://example.com/filing/indiacem-mar-2026"
      }
    },
    update: {},
    create: {
      ticker: "INDIACEM",
      companyName: "India Cements",
      earningsDate: new Date("2026-03-31"),
      fiscalQuarter: "Q4",
      fiscalYear: 2026,
      actualRevenue: 1228.7,
      operatingProfit: 153.2,
      operatingMargin: 12.47,
      netProfit: 59.5,
      actualEPS: 1.9,
      estimatedEPS: 1.5,
      source: "NSE",
      sourceUrl: "https://example.com/filing/indiacem-mar-2026"
    }
  });

  console.log("Sending Earnings Pulse to Telegram...");
  const result = await sendEarningsPulse("INDIACEM");
  
  if (result.success) {
    console.log(`Success! Sent Earnings Pulse to ${result.sentCount} users.`);
  } else {
    console.log("Failed to send pulse.");
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
