import React from "react";

export type BacktestStats = {
  winRate: number;
  sampleSize: number;
  timeframeDays: number;
  avgPriceChange: number;
  eventType: string;
};

type BacktestBadgeProps = {
  stats?: BacktestStats;
};

export function BacktestBadge({ stats }: BacktestBadgeProps) {
  if (!stats) return null;

  const isHighAccuracy = stats.winRate >= 75;

  return (
    <div
      className={`status-chip ${isHighAccuracy ? "positive" : "mixed"}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        fontSize: "12px",
        fontWeight: 600,
        padding: "4px 8px",
        borderRadius: "6px",
        cursor: "help"
      }}
      title={`Historical Accuracy: ${stats.winRate}% across ${stats.sampleSize} past ${stats.eventType} events (${stats.timeframeDays}d window)`}
    >
      <span>🎯 {stats.winRate.toFixed(1)}% Accuracy</span>
      <span style={{ opacity: 0.7, fontSize: "11px" }}>({stats.sampleSize} N)</span>
    </div>
  );
}
