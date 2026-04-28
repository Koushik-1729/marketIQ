import type { PriceData } from "@/domain/entities/price-data";
import type { PriceValidation } from "@/domain/entities/price-validation";
import type { PriceValidationRepositoryPort } from "@/domain/ports/price-validation-repository";
import { validatePriceVolume } from "@/domain/services/validate-price-volume";
import type { PriceBar } from "@/domain/ports/price-bar-repository";
import { prisma } from "@/lib/prisma";

export class PostgresPriceValidationRepository
  implements PriceValidationRepositoryPort
{
  async saveManyPriceData(entries: PriceData[]) {
    if (entries.length === 0) {
      return;
    }

    try {
      for (const entry of entries) {
        await prisma.priceData.upsert({
          where: {
            ticker_timestamp: {
              ticker: entry.ticker,
              timestamp: new Date(entry.timestamp)
            }
          },
          update: {
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close,
            volume: entry.volume
          },
          create: {
            ticker: entry.ticker,
            timestamp: new Date(entry.timestamp),
            open: entry.open,
            high: entry.high,
            low: entry.low,
            close: entry.close,
            volume: entry.volume
          }
        });
      }
    } catch (error) {
      console.warn("price_data persistence unavailable, skipping price bar save", error);
    }
  }

  async getByTickers(tickers: string[]): Promise<PriceValidation[]> {
    if (tickers.length === 0) {
      return [];
    }

    const snapshotRecords = await prisma.priceValidationSnapshot.findMany({
      where: { ticker: { in: tickers } },
      orderBy: { createdAt: "desc" }
    });

    let bars: Awaited<ReturnType<typeof prisma.priceData.findMany>> = [];

    try {
      bars = await prisma.priceData.findMany({
        where: { ticker: { in: tickers } },
        orderBy: [{ ticker: "asc" }, { timestamp: "desc" }]
      });
    } catch (error) {
      console.warn("price_data lookup unavailable, falling back to snapshots", error);
    }

    const barsByTicker = new Map<string, PriceData[]>();

    for (const bar of bars) {
      const existing = barsByTicker.get(bar.ticker) ?? [];
      existing.push({
        ticker: bar.ticker,
        timestamp: bar.timestamp.toISOString(),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
        volume: bar.volume
      });
      barsByTicker.set(bar.ticker, existing);
    }

    const validations: PriceValidation[] = [];
    const snapshotByTicker = new Map<string, (typeof snapshotRecords)[number]>();

    for (const snapshot of snapshotRecords) {
      if (!snapshotByTicker.has(snapshot.ticker)) {
        snapshotByTicker.set(snapshot.ticker, snapshot);
      }
    }

    for (const ticker of tickers) {
      const mappedBars: PriceBar[] = (barsByTicker.get(ticker) ?? []).map((b) => ({
        id: "legacy",
        ticker: b.ticker,
        timestamp: new Date(b.timestamp),
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
        interval: "1d",
        source: "legacy",
        createdAt: new Date()
      }));

      const computed = validatePriceVolume(ticker, mappedBars);

      if (computed) {
        validations.push(computed);
        continue;
      }

      const snapshot = snapshotByTicker.get(ticker);

      if (!snapshot) {
        continue;
      }

      validations.push({
        ticker: snapshot.ticker,
        priceChangePercent: snapshot.breakout ? 2.5 : snapshot.breakdown ? -2.5 : 0,
        volumeRatio: snapshot.volumeSpikeRatio,
        volumeScore: Math.log(Math.max(snapshot.volumeSpikeRatio, 0.001)),
        volatility: 1,
        momentumPersistence: false,
        confirmationStatus:
          snapshot.breakout || snapshot.breakdown
            ? snapshot.volumeSpikeRatio > 1.5
              ? "CONFIRMED"
              : "NEUTRAL"
            : "WEAK",
        note: snapshot.note
      });
    }

    return validations;
  }
}
