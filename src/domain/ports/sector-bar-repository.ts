export type SectorBar = {
  id: string;
  sector: string;
  timestamp: string; // ISO string
  close: number;
  changePercent: number;
  relativeStrength: number;
  momentumScore: number;
  source: string;
  createdAt: string;
};

export interface SectorBarRepository {
  saveMany(bars: Omit<SectorBar, "id" | "createdAt">[]): Promise<void>;
  findRecentBySector(sector: string, limit?: number): Promise<SectorBar[]>;
  getLatestForAllSectors(): Promise<SectorBar[]>;
}
