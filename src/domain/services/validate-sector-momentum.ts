import type { SectorBar } from "@/domain/ports/sector-bar-repository";

export type SectorMomentumStatus = "STRONG" | "WEAK" | "NEUTRAL" | "NO_DATA";

export type SectorValidation = {
  sector: string;
  sectorReturn: number;
  niftyReturn: number;
  relativeStrength: number;
  momentumScore: number;
  status: SectorMomentumStatus;
  note: string;
};

export function validateSectorMomentum(
  sectorName: string,
  sectorBars: SectorBar[],
  niftyBars: SectorBar[]
): SectorValidation {
  if (sectorBars.length === 0 || niftyBars.length === 0) {
    return {
      sector: sectorName,
      sectorReturn: 0,
      niftyReturn: 0,
      relativeStrength: 0,
      momentumScore: 0,
      status: "NO_DATA",
      note: "Sector or Nifty data is missing"
    };
  }

  // Assuming bars are sorted descending (latest first)
  const latestSector = sectorBars[0];
  const latestNifty = niftyBars[0];

  const sectorReturn = latestSector.changePercent;
  const niftyReturn = latestNifty.changePercent;
  const relativeStrength = sectorReturn - niftyReturn;
  const momentumScore = relativeStrength; // basic for now

  let status: SectorMomentumStatus = "NEUTRAL";
  let note = `Sector is moving with Nifty (${relativeStrength > 0 ? "+" : ""}${relativeStrength.toFixed(2)}% RS)`;

  if (relativeStrength > 0.5) {
    status = "STRONG";
    note = `${sectorName} sector is outperforming Nifty by ${relativeStrength.toFixed(2)}%, supporting positive signals.`;
  } else if (relativeStrength < -0.5) {
    status = "WEAK";
    note = `${sectorName} sector is underperforming Nifty by ${Math.abs(relativeStrength).toFixed(2)}%, supporting negative signals.`;
  }

  return {
    sector: sectorName,
    sectorReturn,
    niftyReturn,
    relativeStrength,
    momentumScore,
    status,
    note
  };
}
