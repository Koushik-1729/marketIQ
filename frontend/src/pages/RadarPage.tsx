import React from "react";
import { Signal } from "../components/SignalTable";

type RadarPageProps = {
  signals: Signal[];
};

export function RadarPage({ signals }: RadarPageProps) {
  // Filter active block/bulk deals dynamically from backend database
  const dealSignals = signals.filter((s) => {
    const ev = s.eventType.toLowerCase();
    return ev.includes("deal") || ev.includes("bulk") || ev.includes("block");
  });

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Insider Radar</div>
        <h1 className="headline">
          Block & Bulk deals <span>flow radar</span>.
        </h1>
        <p className="subtext">Tracking institutional accumulation & promoter filings.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Deals Tracker</div>
            <h3>Institutional Transactions ({dealSignals.length})</h3>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Deal Type</th>
                <th>Transaction Details</th>
                <th>Sentiment</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {dealSignals.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "32px", color: "var(--text-tertiary)" }}>
                    No active block or bulk deal signals in database.
                  </td>
                </tr>
              ) : (
                dealSignals.map((deal) => (
                  <tr key={deal.id}>
                    <td><span className="ticker-pill">{deal.ticker}</span></td>
                    <td><span className="status-chip positive">{deal.eventType.toUpperCase()}</span></td>
                    <td><strong>{deal.company} Setup</strong></td>
                    <td>
                      <span className={`status-chip ${deal.sentiment === "positive" ? "positive" : deal.sentiment === "mixed" ? "mixed" : "risk"}`}>
                        {deal.sentiment.toUpperCase()}
                      </span>
                    </td>
                    <td><span className="footnote">{deal.eventSummary}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
