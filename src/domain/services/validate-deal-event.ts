import type { DealEvent } from "@/domain/ports/deal-event-repository";

export type DealValidationStatus = 
  | "SMART_BUYING"
  | "SMART_SELLING"
  | "INSTITUTIONAL_ROTATION"
  | "NO_DATA";

export type DealValidation = {
  ticker: string;
  status: DealValidationStatus;
  note: string;
  latestDeal?: DealEvent;
};

// Simple heuristic to detect if a party name looks like an institution
function isInstitution(name: string | null | undefined): boolean {
  if (!name) return false;
  const upper = name.toUpperCase();
  const keywords = ["FUND", "CAPITAL", "MANAGEMENT", "ASSET", "BANK", "INVESTMENT", "LLP", "PARTNERS", "VENTURES", "TRUST", "SECURITIES"];
  return keywords.some(k => upper.includes(k));
}

export function validateDealEvent(ticker: string, recentDeals: DealEvent[]): DealValidation {
  if (!recentDeals || recentDeals.length === 0) {
    return {
      ticker,
      status: "NO_DATA",
      note: "No block or bulk deals detected recently."
    };
  }

  // Evaluate the most recent deal for the ticker
  const latestDeal = recentDeals[0];
  const buyerIsInst = isInstitution(latestDeal.buyerName);
  const sellerIsInst = isInstitution(latestDeal.sellerName);

  let status: DealValidationStatus = "NO_DATA";
  let note = "Deal detected but unable to classify.";

  if (latestDeal.buyerName && latestDeal.sellerName) {
    if (buyerIsInst && sellerIsInst) {
      status = "INSTITUTIONAL_ROTATION";
      note = `Institutional rotation: ${latestDeal.sellerName} sold to ${latestDeal.buyerName}.`;
    } else if (buyerIsInst && !sellerIsInst) {
      status = "SMART_BUYING";
      note = `Smart money buying: ${latestDeal.buyerName} absorbed retail/unknown selling.`;
    } else if (!buyerIsInst && sellerIsInst) {
      status = "SMART_SELLING";
      note = `Smart money selling: ${latestDeal.sellerName} distributed to retail/unknown buyers.`;
    } else {
      status = "NO_DATA";
      note = "Deal detected between unknown/retail parties. Ignoring.";
    }
  } else if (latestDeal.buyerName) {
    status = buyerIsInst ? "SMART_BUYING" : "NO_DATA";
    note = buyerIsInst ? `Large buyer detected: ${latestDeal.buyerName}.` : "Unknown large buyer detected.";
  } else if (latestDeal.sellerName) {
    status = sellerIsInst ? "SMART_SELLING" : "NO_DATA";
    note = sellerIsInst ? `Large seller detected: ${latestDeal.sellerName}.` : "Unknown large seller detected.";
  }

  return {
    ticker,
    status,
    note,
    latestDeal
  };
}
