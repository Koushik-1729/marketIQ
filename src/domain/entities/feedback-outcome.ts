export type FeedbackOutcome = {
  signalId: string;
  horizon: "1d" | "3d" | "7d";
  priceMovePct: number;
  volumeMovePct: number;
  userAction: "clicked" | "saved" | "ignored" | "useful" | "not_useful";
};
