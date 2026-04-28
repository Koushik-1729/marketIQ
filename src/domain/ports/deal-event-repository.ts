export type DealType = "BLOCK" | "BULK";

export type DealEvent = {
  id: string;
  ticker: string;
  companyName: string;
  dealType: DealType;
  buyerName: string | null;
  sellerName: string | null;
  quantity: number;
  price: number;
  dealValue: number;
  dealDate: string; // ISO string
  source: string;
  createdAt: string; // ISO string
};

export interface DealEventRepository {
  saveMany(deals: Omit<DealEvent, "id" | "createdAt">[]): Promise<void>;
  findLatest(limit?: number): Promise<DealEvent[]>;
  findRecentByTicker(ticker: string, days?: number): Promise<DealEvent[]>;
}
