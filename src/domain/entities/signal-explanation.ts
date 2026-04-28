export type SignalExplanation = {
  stock: string;
  score: number;
  reasons: string[];
  risk: "low" | "medium" | "high";
  watchItems: string[];
};
