import type { InstitutionalFlow } from "@/domain/ports/institutional-flow-repository";

export type InstitutionalFlowStatus = 
  | "FII_DII_BOTH_BUYING" 
  | "FII_SELLING_DII_BUYING" 
  | "FII_DII_BOTH_SELLING" 
  | "MIXED_NEUTRAL" 
  | "NO_DATA";

export type FlowValidation = {
  fiiNet: number;
  diiNet: number;
  combinedNet: number;
  status: InstitutionalFlowStatus;
  note: string;
};

// Thresholds for MVP
const STRONG_POSITIVE_THRESHOLD = 500;
const STRONG_NEGATIVE_THRESHOLD = -500;

export function validateInstitutionalFlow(latestFlows: InstitutionalFlow[]): FlowValidation {
  if (!latestFlows || latestFlows.length === 0) {
    return {
      fiiNet: 0,
      diiNet: 0,
      combinedNet: 0,
      status: "NO_DATA",
      note: "Institutional flow data is missing or delayed."
    };
  }

  // Find latest FII and DII
  const fiiFlow = latestFlows.find(f => f.investorType === "FII" && f.marketSegment === "EQUITY");
  const diiFlow = latestFlows.find(f => f.investorType === "DII" && f.marketSegment === "EQUITY");

  if (!fiiFlow || !diiFlow) {
    return {
      fiiNet: 0,
      diiNet: 0,
      combinedNet: 0,
      status: "NO_DATA",
      note: "Incomplete institutional flow data."
    };
  }

  const fiiNet = fiiFlow.netValue;
  const diiNet = diiFlow.netValue;
  const combinedNet = fiiNet + diiNet;

  let status: InstitutionalFlowStatus = "MIXED_NEUTRAL";
  let note = "Institutional flow is mixed.";

  if (fiiNet > 0 && diiNet > 0) {
    status = "FII_DII_BOTH_BUYING";
    note = "Institutional flow is positive; FII and DII were net buyers.";
  } else if (fiiNet < 0 && diiNet < 0) {
    status = "FII_DII_BOTH_SELLING";
    note = "Institutional flow is negative; FII and DII were net sellers.";
  } else if (fiiNet < 0 && diiNet > 0) {
    status = "FII_SELLING_DII_BUYING";
    note = "FII selling pressure detected; DIIs are supporting.";
  } else if (fiiNet > 0 && diiNet < 0) {
    status = "MIXED_NEUTRAL";
    note = "FII buying but DII selling; net flow is mixed.";
  }

  // Override note with strong combined context if thresholds hit
  if (combinedNet > STRONG_POSITIVE_THRESHOLD) {
    note += ` Combined net flow is strongly bullish (+₹${combinedNet.toFixed(2)} Cr).`;
  } else if (combinedNet < STRONG_NEGATIVE_THRESHOLD) {
    note += ` Combined net flow is strongly bearish (-₹${Math.abs(combinedNet).toFixed(2)} Cr).`;
  }

  return {
    fiiNet,
    diiNet,
    combinedNet,
    status,
    note
  };
}
