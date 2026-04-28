-- CreateEnum
CREATE TYPE "FiscalQuarter" AS ENUM ('Q1', 'Q2', 'Q3', 'Q4');

-- CreateEnum
CREATE TYPE "GuidanceTone" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EarningsSource" AS ENUM ('NSE', 'BSE');

-- CreateTable
CREATE TABLE "EarningsEvent" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "earningsDate" TIMESTAMP(3) NOT NULL,
    "fiscalQuarter" "FiscalQuarter" NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "estimatedEPS" DOUBLE PRECISION,
    "actualEPS" DOUBLE PRECISION,
    "epsSurprisePercent" DOUBLE PRECISION,
    "estimatedRevenue" DOUBLE PRECISION,
    "actualRevenue" DOUBLE PRECISION,
    "revenueSurprisePercent" DOUBLE PRECISION,
    "hasGuidance" BOOLEAN NOT NULL DEFAULT false,
    "guidanceTone" "GuidanceTone" NOT NULL DEFAULT 'UNKNOWN',
    "source" "EarningsSource" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EarningsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EarningsEvent_ticker_idx" ON "EarningsEvent"("ticker");

-- CreateIndex
CREATE INDEX "EarningsEvent_earningsDate_idx" ON "EarningsEvent"("earningsDate");

-- CreateIndex
CREATE INDEX "EarningsEvent_fiscalQuarter_idx" ON "EarningsEvent"("fiscalQuarter");

-- CreateIndex
CREATE UNIQUE INDEX "EarningsEvent_ticker_sourceUrl_key" ON "EarningsEvent"("ticker", "sourceUrl");
