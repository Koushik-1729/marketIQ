import type { PriceData } from "@/domain/entities/price-data";
import type { PriceValidation } from "@/domain/entities/price-validation";

export interface PriceValidationRepositoryPort {
  saveManyPriceData(entries: PriceData[]): Promise<void>;
  getByTickers(tickers: string[]): Promise<PriceValidation[]>;
}
