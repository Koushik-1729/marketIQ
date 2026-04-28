export const TICKER_TO_YAHOO: Record<string, string> = {
  TCS: "TCS.NS",
  RELIANCE: "RELIANCE.NS",
  INFY: "INFY.NS",
  HDFCBANK: "HDFCBANK.NS",
  ICICIBANK: "ICICIBANK.NS",
  SBIN: "SBIN.NS",
  BHARTIARTL: "BHARTIARTL.NS",
  ITC: "ITC.NS",
  LARSEN: "LT.NS",
  HINDUNILVR: "HINDUNILVR.NS"
};

export function getYahooTicker(ticker: string): string {
  if (TICKER_TO_YAHOO[ticker]) {
    return TICKER_TO_YAHOO[ticker];
  }
  
  if (!ticker.includes(".")) {
    return `${ticker}.NS`;
  }
  
  return ticker;
}
