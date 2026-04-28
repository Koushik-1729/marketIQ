export type InvestorType = "FII" | "DII";
export type MarketSegment = "EQUITY" | "DEBT" | "FNO";

export type InstitutionalFlow = {
  id: string;
  date: string; // ISO string
  investorType: InvestorType;
  marketSegment: MarketSegment;
  buyValue: number;
  sellValue: number;
  netValue: number;
  source: string;
  createdAt: string;
};

export interface InstitutionalFlowRepository {
  saveMany(flows: Omit<InstitutionalFlow, "id" | "createdAt">[]): Promise<void>;
  findLatest(segment?: MarketSegment): Promise<InstitutionalFlow[]>;
  findRecent(days: number, segment?: MarketSegment): Promise<InstitutionalFlow[]>;
}
