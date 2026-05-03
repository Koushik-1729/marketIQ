-- CreateEnum
CREATE TYPE "FeedbackType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "InsightCardType" AS ENUM ('EARNINGS', 'ORDER', 'ANNOUNCEMENT', 'DEAL', 'CORPORATE_ACTION', 'NEWS');

-- AlterTable
ALTER TABLE "EarningsEvent" ADD COLUMN     "netProfit" DOUBLE PRECISION,
ADD COLUMN     "operatingMargin" DOUBLE PRECISION,
ADD COLUMN     "operatingProfit" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramChatId" TEXT,
ADD COLUMN     "telegramEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Watchlist" ALTER COLUMN "sectors" DROP DEFAULT,
ALTER COLUMN "themes" DROP DEFAULT;

-- CreateTable
CREATE TABLE "signal_feedback" (
    "id" TEXT NOT NULL,
    "signalId" TEXT NOT NULL,
    "userId" TEXT,
    "feedbackType" "FeedbackType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "signal_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_bars" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "interval" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sector_bars" (
    "id" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "changePercent" DOUBLE PRECISION NOT NULL,
    "relativeStrength" DOUBLE PRECISION NOT NULL,
    "momentumScore" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sector_bars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutional_flows" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "investorType" TEXT NOT NULL,
    "marketSegment" TEXT NOT NULL,
    "buyValue" DOUBLE PRECISION NOT NULL,
    "sellValue" DOUBLE PRECISION NOT NULL,
    "netValue" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "institutional_flows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deal_events" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "dealType" TEXT NOT NULL,
    "buyerName" TEXT,
    "sellerName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "dealValue" DOUBLE PRECISION NOT NULL,
    "dealDate" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deal_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insight_cards" (
    "id" TEXT NOT NULL,
    "signalId" TEXT,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "cardType" "InsightCardType" NOT NULL,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sentiment" "SignalSentiment" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rating" INTEGER NOT NULL,
    "impactScore" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insight_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "signal_feedback_signalId_idx" ON "signal_feedback"("signalId");

-- CreateIndex
CREATE INDEX "signal_feedback_userId_idx" ON "signal_feedback"("userId");

-- CreateIndex
CREATE INDEX "price_bars_ticker_idx" ON "price_bars"("ticker");

-- CreateIndex
CREATE INDEX "price_bars_timestamp_idx" ON "price_bars"("timestamp");

-- CreateIndex
CREATE INDEX "price_bars_ticker_timestamp_idx" ON "price_bars"("ticker", "timestamp");

-- CreateIndex
CREATE INDEX "sector_bars_sector_idx" ON "sector_bars"("sector");

-- CreateIndex
CREATE INDEX "sector_bars_timestamp_idx" ON "sector_bars"("timestamp");

-- CreateIndex
CREATE INDEX "sector_bars_sector_timestamp_idx" ON "sector_bars"("sector", "timestamp");

-- CreateIndex
CREATE INDEX "institutional_flows_date_idx" ON "institutional_flows"("date");

-- CreateIndex
CREATE INDEX "institutional_flows_investorType_idx" ON "institutional_flows"("investorType");

-- CreateIndex
CREATE INDEX "institutional_flows_marketSegment_idx" ON "institutional_flows"("marketSegment");

-- CreateIndex
CREATE INDEX "deal_events_ticker_idx" ON "deal_events"("ticker");

-- CreateIndex
CREATE INDEX "deal_events_dealDate_idx" ON "deal_events"("dealDate");

-- CreateIndex
CREATE INDEX "deal_events_dealType_idx" ON "deal_events"("dealType");

-- CreateIndex
CREATE INDEX "insight_cards_ticker_idx" ON "insight_cards"("ticker");

-- CreateIndex
CREATE INDEX "insight_cards_cardType_idx" ON "insight_cards"("cardType");

-- CreateIndex
CREATE INDEX "insight_cards_publishedAt_idx" ON "insight_cards"("publishedAt");

-- CreateIndex
CREATE INDEX "insight_cards_impactScore_idx" ON "insight_cards"("impactScore");

-- AddForeignKey
ALTER TABLE "insight_cards" ADD CONSTRAINT "insight_cards_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EngineSignal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
