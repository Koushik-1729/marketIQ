import "dotenv/config";
import { PrismaClient, RiskLevel, SignalSentiment } from "@prisma/client";
import { simpleHash } from "../src/lib/hash";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo.trader@example.com" },
    update: {},
    create: {
      email: "demo.trader@example.com"
    }
  });

  const watchlist = await prisma.watchlist.upsert({
    where: { id: "seed_watchlist_primary" },
    update: {},
    create: {
      id: "seed_watchlist_primary",
      userId: user.id,
      name: "Primary Watchlist",
      riskTolerance: "medium",
      sectors: ["Financials", "IT"],
      themes: ["capital-expenditure"]
    }
  });

  await prisma.watchlistTicker.createMany({
    data: [
      { watchlistId: watchlist.id, ticker: "RELIANCE" },
      { watchlistId: watchlist.id, ticker: "INFY" },
      { watchlistId: watchlist.id, ticker: "HDFCBANK" }
    ],
    skipDuplicates: true
  });

  const rawDocuments = [
    {
      id: "seed_raw_reliance",
      source: "Reuters Markets",
      url: "https://example.com/reliance-partnership",
      title: "Reliance expands partnership pipeline as retail and telecom capex picks up",
      content:
        "Reliance expansion, growth momentum, and strong partnership updates supported a breakout narrative with broad media confirmation.",
      rawData: {
        body: "Reliance expansion, growth momentum, and strong partnership updates supported a breakout narrative with broad media confirmation."
      },
      rawPayloadFormat: "text",
      urlHash: simpleHash("https://example.com/reliance-partnership"),
      publishedAt: new Date("2026-04-26T07:42:00+05:30"),
      fetchedAt: new Date("2026-04-26T07:44:00+05:30")
    },
    {
      id: "seed_raw_hdfcbank",
      source: "NSE Filing",
      url: "https://example.com/hdfcbank-filing",
      title: "HDFC Bank disclosure highlights promoter-related transaction update",
      content:
        "Promoter transaction disclosure and elevated delivery activity raised concern around near-term positioning.",
      rawData: {
        body: "Promoter transaction disclosure and elevated delivery activity raised concern around near-term positioning."
      },
      rawPayloadFormat: "text",
      urlHash: simpleHash("https://example.com/hdfcbank-filing"),
      publishedAt: new Date("2026-04-26T07:30:00+05:30"),
      fetchedAt: new Date("2026-04-26T07:31:00+05:30")
    }
  ];

  for (const document of rawDocuments) {
    await prisma.rawDocument.upsert({
      where: { id: document.id },
      update: document,
      create: document
    });
  }

  await prisma.marketContextSnapshot.create({
    data: {
      niftyTrend: "bull",
      bankNiftyTrend: "neutral",
      giftNiftyChange: 114,
      indiaVix: 12.8,
      fiiFlowCr: -642,
      diiFlowCr: 1228,
      globalCues: "positive",
      sectorStrength: {
        Energy: 3.4,
        Financials: -0.8,
        IT: 0.5,
        Auto: 2.1
      }
    }
  });

  await prisma.priceData.createMany({
    data: [
      {
        ticker: "RELIANCE",
        timestamp: new Date("2026-04-26T09:15:00+05:30"),
        open: 2920,
        high: 3008,
        low: 2916,
        close: 2994,
        volume: 5250000
      },
      {
        ticker: "RELIANCE",
        timestamp: new Date("2026-04-25T15:30:00+05:30"),
        open: 2875,
        high: 2920,
        low: 2868,
        close: 2915,
        volume: 2600000
      },
      {
        ticker: "RELIANCE",
        timestamp: new Date("2026-04-24T15:30:00+05:30"),
        open: 2860,
        high: 2882,
        low: 2840,
        close: 2870,
        volume: 2450000
      },
      {
        ticker: "HDFCBANK",
        timestamp: new Date("2026-04-26T09:15:00+05:30"),
        open: 1688,
        high: 1691,
        low: 1639,
        close: 1642,
        volume: 4720000
      },
      {
        ticker: "HDFCBANK",
        timestamp: new Date("2026-04-25T15:30:00+05:30"),
        open: 1714,
        high: 1719,
        low: 1684,
        close: 1686,
        volume: 2480000
      },
      {
        ticker: "HDFCBANK",
        timestamp: new Date("2026-04-24T15:30:00+05:30"),
        open: 1728,
        high: 1732,
        low: 1708,
        close: 1716,
        volume: 2310000
      },
      {
        ticker: "INFY",
        timestamp: new Date("2026-04-26T09:15:00+05:30"),
        open: 1460,
        high: 1466,
        low: 1455,
        close: 1461,
        volume: 1290000
      },
      {
        ticker: "INFY",
        timestamp: new Date("2026-04-25T15:30:00+05:30"),
        open: 1458,
        high: 1463,
        low: 1452,
        close: 1459,
        volume: 1210000
      }
    ],
    skipDuplicates: true
  });

  await prisma.priceValidationSnapshot.createMany({
    data: [
      {
        ticker: "RELIANCE",
        breakout: true,
        breakdown: false,
        gapDirection: "up",
        volumeSpikeRatio: 2.4,
        relativeStrength: 1.2,
        deliverySpike: false,
        note: "Breakout with strong volume and relative strength vs Nifty"
      },
      {
        ticker: "HDFCBANK",
        breakout: false,
        breakdown: true,
        gapDirection: "down",
        volumeSpikeRatio: 1.8,
        relativeStrength: -0.9,
        deliverySpike: true,
        note: "Breakdown with delivery spike and weak Bank Nifty relative strength"
      }
    ],
    skipDuplicates: true
  });

  await prisma.engineSignal.upsert({
    where: { id: "seed_signal_reliance" },
    update: {},
    create: {
      id: "seed_signal_reliance",
      ticker: "RELIANCE",
      score: 84,
      confidence: 0.91,
      sentiment: SignalSentiment.positive,
      riskLevel: RiskLevel.low,
      explanation: {
        create: {
          reasons: ["Order win narrative", "Multi-source confirmation", "Price breakout"],
          summary: "Reliance is in focus due to corroborated positive developments and market confirmation."
        }
      }
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
