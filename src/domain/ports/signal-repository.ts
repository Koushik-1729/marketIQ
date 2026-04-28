import type { EngineSignal } from "@/domain/entities/engine-signal";

export type SignalQuery = {
  ticker?: string;
  minScore?: number;
  limit?: number;
  skip?: number;
  sort?: "score_desc" | "score_asc" | "latest";
};

export interface SignalRepositoryPort {
  saveMany(signals: EngineSignal[]): Promise<EngineSignal[]>;
  findRecent(limit?: number): Promise<EngineSignal[]>;
  findMany(query: SignalQuery): Promise<EngineSignal[]>;
  findById(id: string): Promise<EngineSignal | null>;
}
