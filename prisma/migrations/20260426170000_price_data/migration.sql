CREATE TABLE "price_data" (
    "id" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "price_data_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "price_data_ticker_idx" ON "price_data"("ticker");
CREATE INDEX "price_data_timestamp_idx" ON "price_data"("timestamp");
CREATE UNIQUE INDEX "price_data_ticker_timestamp_key" ON "price_data"("ticker", "timestamp");
