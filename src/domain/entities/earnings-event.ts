export type FiscalQuarter = "Q1" | "Q2" | "Q3" | "Q4";
export type GuidanceTone = "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "UNKNOWN";
export type EarningsSource = "NSE" | "BSE";

export type EarningsEvent = {
  id?: string;
  ticker: string;
  companyName: string;
  earningsDate: string;
  fiscalQuarter: FiscalQuarter;
  fiscalYear: number;
  estimatedEPS: number | null;
  actualEPS: number | null;
  epsSurprisePercent: number | null;
  estimatedRevenue: number | null;
  actualRevenue: number | null;
  revenueSurprisePercent: number | null;
  hasGuidance: boolean;
  guidanceTone: GuidanceTone;
  source: EarningsSource;
  sourceUrl: string;
  operatingProfit: number | null;
  operatingMargin: number | null;
  netProfit: number | null;
  createdAt?: string;
};
