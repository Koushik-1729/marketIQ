import type { PriceValidation } from "@/domain/entities/price-validation";
import type { PriceValidationRepositoryPort } from "@/domain/ports/price-validation-repository";

export class InMemoryPriceValidationRepositoryAdapter
  implements PriceValidationRepositoryPort
{
  async saveManyPriceData() {
    return;
  }

  async getByTickers(tickers: string[]) {
    const all: PriceValidation[] = [
      {
        ticker: "RELIANCE",
        priceChangePercent: 2.8,
        volumeRatio: 2.4,
        volumeScore: Math.log(2.4),
        volatility: 1.2,
        momentumPersistence: true,
        confirmationStatus: "CONFIRMED",
        note: "Breakout with strong volume and relative strength vs Nifty"
      },
      {
        ticker: "HDFCBANK",
        priceChangePercent: -2.3,
        volumeRatio: 1.8,
        volumeScore: Math.log(1.8),
        volatility: 0.9,
        momentumPersistence: false,
        confirmationStatus: "CONFIRMED",
        note: "Breakdown with delivery spike and weak Bank Nifty relative strength"
      },
      {
        ticker: "INFY",
        priceChangePercent: 0.2,
        volumeRatio: 1.1,
        volumeScore: Math.log(1.1),
        volatility: 0.8,
        momentumPersistence: false,
        confirmationStatus: "WEAK",
        note: "Neutral tape with mild underperformance"
      },
      {
        ticker: "TATAMOTORS",
        priceChangePercent: 1.4,
        volumeRatio: 2.1,
        volumeScore: Math.log(2.1),
        volatility: 1.0,
        momentumPersistence: false,
        confirmationStatus: "NEUTRAL",
        note: "Buzz confirmed by volume spike, but breakout still incomplete"
      }
    ];

    return all.filter((item) => tickers.includes(item.ticker));
  }
}
