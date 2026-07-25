import React from "react";
import { SignalTable, Signal } from "../components/SignalTable";

type OverviewPageProps = {
  signals: Signal[];
};

export function OverviewPage({ signals }: OverviewPageProps) {
  const topSignal = signals[0];

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Executive Intelligence Desk</div>
            <h1 className="headline">
              Event-driven signals, <span className="text-highlight">ranked conviction</span>.
            </h1>
            <p className="subtext">
              Real-time feed combining exchange filings, news RSS feeds, institutional flows, and price action.
            </p>
          </div>

          <div className="hero-summary-grid">
            <div className="compact-stat">
              <span className="eyebrow">Tracked</span>
              <strong>{signals.length}</strong>
              <span className="footnote">live signals</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">High Conviction</span>
              <strong>{signals.filter((s) => s.impactScore >= 64).length}</strong>
              <span className="footnote">setups</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Avg Score</span>
              <strong>64</strong>
              <span className="footnote">desk score</span>
            </div>
          </div>
        </div>
      </section>

      {topSignal && (
        <section className="glass-card">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Top Setup</div>
              <h3>Featured Signal: {topSignal.ticker}</h3>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px" }}>
            <div>
              <h2 style={{ fontSize: "24px", color: "#E9D5FF", margin: "0 0 12px 0" }}>{topSignal.company}</h2>
              <p className="subtext">{topSignal.eventSummary}</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "rgba(192, 115, 206, 0.1)", padding: "16px", borderRadius: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Impact Score:</span>
                <strong style={{ color: "#C073CE" }}>{topSignal.impactScore}/100</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Confidence:</span>
                <strong style={{ color: "#10b981" }}>{Math.round(topSignal.confidence * 100)}%</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Risk Level:</span>
                <span className="status-chip mixed">{topSignal.riskLevel}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Ranked Signals</div>
            <h3>Top Conviction Table</h3>
          </div>
        </div>
        <SignalTable signals={signals} />
      </section>
    </div>
  );
}
