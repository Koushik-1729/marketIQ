-- CreateEnum
CREATE TYPE "SignalSentiment" AS ENUM ('positive', 'negative', 'neutral', 'mixed');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "FeedbackDirection" AS ENUM ('UP', 'DOWN', 'NEUTRAL');

-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'RUNNING');

-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Watchlist" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "riskTolerance" TEXT NOT NULL DEFAULT 'medium',
  "sectors" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "themes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  CONSTRAINT "Watchlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchlistTicker" (
  "id" TEXT NOT NULL,
  "watchlistId" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WatchlistTicker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawDocument" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "rawData" JSONB NOT NULL,
  "rawPayloadFormat" TEXT NOT NULL,
  "urlHash" TEXT NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL,
  "fetchedAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RawDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NormalizedDocument" (
  "id" TEXT NOT NULL,
  "rawDocumentId" TEXT NOT NULL,
  "cleanedText" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "NormalizedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtractedEvent" (
  "id" TEXT NOT NULL,
  "normalizedDocumentId" TEXT NOT NULL,
  "tickers" JSONB NOT NULL,
  "keywords" JSONB NOT NULL,
  "eventHints" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExtractedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichedEvent" (
  "id" TEXT NOT NULL,
  "extractedEventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "sentiment" "SignalSentiment" NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "eventWeight" DOUBLE PRECISION NOT NULL,
  "sourceCredibility" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnrichedEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventCluster" (
  "id" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "clusterHash" TEXT NOT NULL,
  "sourceCount" INTEGER NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventCluster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineSignal" (
  "id" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "score" DOUBLE PRECISION NOT NULL,
  "confidence" DOUBLE PRECISION NOT NULL,
  "sentiment" "SignalSentiment" NOT NULL,
  "riskLevel" "RiskLevel" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "clusterHash" TEXT,
  CONSTRAINT "EngineSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SignalExplanation" (
  "id" TEXT NOT NULL,
  "signalId" TEXT NOT NULL,
  "reasons" JSONB NOT NULL,
  "summary" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SignalExplanation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedbackOutcome" (
  "id" TEXT NOT NULL,
  "signalId" TEXT NOT NULL,
  "outcome" "FeedbackDirection" NOT NULL,
  "priceChange" DOUBLE PRECISION NOT NULL,
  "evaluatedAt" TIMESTAMP(3) NOT NULL,
  "horizon" TEXT,
  "volumeChange" DOUBLE PRECISION,
  "userAction" TEXT,
  CONSTRAINT "FeedbackOutcome_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "status" "IngestionStatus" NOT NULL,
  "documentsFetched" INTEGER NOT NULL,
  "errors" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceHealth" (
  "id" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "lastRun" TIMESTAMP(3),
  "successRate" DOUBLE PRECISION NOT NULL,
  "failureCount" INTEGER NOT NULL,
  CONSTRAINT "SourceHealth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketContextSnapshot" (
  "id" TEXT NOT NULL,
  "niftyTrend" TEXT NOT NULL,
  "bankNiftyTrend" TEXT NOT NULL,
  "giftNiftyChange" DOUBLE PRECISION NOT NULL,
  "indiaVix" DOUBLE PRECISION NOT NULL,
  "fiiFlowCr" DOUBLE PRECISION NOT NULL,
  "diiFlowCr" DOUBLE PRECISION NOT NULL,
  "globalCues" TEXT NOT NULL,
  "sectorStrength" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MarketContextSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceValidationSnapshot" (
  "id" TEXT NOT NULL,
  "ticker" TEXT NOT NULL,
  "breakout" BOOLEAN NOT NULL,
  "breakdown" BOOLEAN NOT NULL,
  "gapDirection" TEXT NOT NULL,
  "volumeSpikeRatio" DOUBLE PRECISION NOT NULL,
  "relativeStrength" DOUBLE PRECISION NOT NULL,
  "deliverySpike" BOOLEAN NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PriceValidationSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE INDEX "Watchlist_userId_idx" ON "Watchlist"("userId");
CREATE INDEX "Watchlist_createdAt_idx" ON "Watchlist"("createdAt");
CREATE INDEX "WatchlistTicker_watchlistId_idx" ON "WatchlistTicker"("watchlistId");
CREATE INDEX "WatchlistTicker_ticker_idx" ON "WatchlistTicker"("ticker");
CREATE UNIQUE INDEX "WatchlistTicker_watchlistId_ticker_key" ON "WatchlistTicker"("watchlistId", "ticker");
CREATE UNIQUE INDEX "RawDocument_urlHash_key" ON "RawDocument"("urlHash");
CREATE INDEX "RawDocument_source_idx" ON "RawDocument"("source");
CREATE INDEX "RawDocument_publishedAt_idx" ON "RawDocument"("publishedAt");
CREATE INDEX "RawDocument_fetchedAt_idx" ON "RawDocument"("fetchedAt");
CREATE INDEX "NormalizedDocument_rawDocumentId_idx" ON "NormalizedDocument"("rawDocumentId");
CREATE INDEX "NormalizedDocument_createdAt_idx" ON "NormalizedDocument"("createdAt");
CREATE INDEX "ExtractedEvent_normalizedDocumentId_idx" ON "ExtractedEvent"("normalizedDocumentId");
CREATE INDEX "ExtractedEvent_createdAt_idx" ON "ExtractedEvent"("createdAt");
CREATE INDEX "EnrichedEvent_eventType_idx" ON "EnrichedEvent"("eventType");
CREATE INDEX "EnrichedEvent_createdAt_idx" ON "EnrichedEvent"("createdAt");
CREATE UNIQUE INDEX "EventCluster_clusterHash_key" ON "EventCluster"("clusterHash");
CREATE INDEX "EventCluster_ticker_idx" ON "EventCluster"("ticker");
CREATE INDEX "EventCluster_startTime_idx" ON "EventCluster"("startTime");
CREATE INDEX "EventCluster_endTime_idx" ON "EventCluster"("endTime");
CREATE INDEX "EngineSignal_ticker_idx" ON "EngineSignal"("ticker");
CREATE INDEX "EngineSignal_score_idx" ON "EngineSignal"("score");
CREATE INDEX "EngineSignal_createdAt_idx" ON "EngineSignal"("createdAt");
CREATE UNIQUE INDEX "SignalExplanation_signalId_key" ON "SignalExplanation"("signalId");
CREATE INDEX "SignalExplanation_createdAt_idx" ON "SignalExplanation"("createdAt");
CREATE INDEX "FeedbackOutcome_signalId_idx" ON "FeedbackOutcome"("signalId");
CREATE INDEX "FeedbackOutcome_evaluatedAt_idx" ON "FeedbackOutcome"("evaluatedAt");
CREATE INDEX "IngestionRun_source_idx" ON "IngestionRun"("source");
CREATE INDEX "IngestionRun_startedAt_idx" ON "IngestionRun"("startedAt");
CREATE INDEX "IngestionRun_completedAt_idx" ON "IngestionRun"("completedAt");
CREATE UNIQUE INDEX "SourceHealth_source_key" ON "SourceHealth"("source");
CREATE INDEX "SourceHealth_source_idx" ON "SourceHealth"("source");
CREATE INDEX "MarketContextSnapshot_createdAt_idx" ON "MarketContextSnapshot"("createdAt");
CREATE INDEX "PriceValidationSnapshot_ticker_idx" ON "PriceValidationSnapshot"("ticker");
CREATE INDEX "PriceValidationSnapshot_createdAt_idx" ON "PriceValidationSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "Watchlist" ADD CONSTRAINT "Watchlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WatchlistTicker" ADD CONSTRAINT "WatchlistTicker_watchlistId_fkey" FOREIGN KEY ("watchlistId") REFERENCES "Watchlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NormalizedDocument" ADD CONSTRAINT "NormalizedDocument_rawDocumentId_fkey" FOREIGN KEY ("rawDocumentId") REFERENCES "RawDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExtractedEvent" ADD CONSTRAINT "ExtractedEvent_normalizedDocumentId_fkey" FOREIGN KEY ("normalizedDocumentId") REFERENCES "NormalizedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnrichedEvent" ADD CONSTRAINT "EnrichedEvent_extractedEventId_fkey" FOREIGN KEY ("extractedEventId") REFERENCES "ExtractedEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SignalExplanation" ADD CONSTRAINT "SignalExplanation_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "EngineSignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
