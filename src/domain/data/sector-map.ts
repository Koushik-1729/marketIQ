export const SECTOR_MAP: Record<string, string> = {
  RELIANCE: "Energy",
  ONGC: "Energy",
  POWERGRID: "Energy",
  NTPC: "Energy",

  TCS: "IT",
  INFY: "IT",
  HCLTECH: "IT",
  WIPRO: "IT",
  TECHM: "IT",

  HDFCBANK: "Banking",
  ICICIBANK: "Banking",
  SBIN: "Banking",
  AXISBANK: "Banking",
  KOTAKBANK: "Banking",

  TATAMOTORS: "Auto",
  MARUTI: "Auto",
  M_M: "Auto",
  BAJAJ_AUTO: "Auto",

  SUNPHARMA: "Pharma",
  DRREDDY: "Pharma",
  DIVISLAB: "Pharma",
  CIPLA: "Pharma",

  ITC: "FMCG",
  HUL: "FMCG",
  NESTLEIND: "FMCG",

  TATASTEEL: "Metal",
  HINDALCO: "Metal",
  JSWSTEEL: "Metal",

  DLF: "Realty",
  GODREJPROP: "Realty"
};

export const SECTOR_INDEX_MAPPING: Record<string, string> = {
  "IT": "^CNXIT",
  "Banking": "^NSEBANK",
  "Auto": "^CNXAUTO",
  "Pharma": "^CNXPHARMA",
  "FMCG": "^CNXFMCG",
  "Metal": "^CNXMETAL",
  "Realty": "^CNXREALTY",
  "Energy": "^CNXENERGY"
};

export const NIFTY_50_TICKER = "^NSEI";

export function getSectorForTicker(ticker: string): string | null {
  return SECTOR_MAP[ticker] ?? null;
}

export function getIndexForSector(sector: string): string | null {
  return SECTOR_INDEX_MAPPING[sector] ?? null;
}
