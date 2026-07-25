import React from "react";
import { Signal } from "../components/SignalTable";

type EarningsPageProps = {
  signals: Signal[];
};

export function EarningsPage({ signals }: EarningsPageProps) {
  // Filter active earnings signals dynamically from backend database
  const earningsSignals = signals.filter((s) => {
    const ev = s.eventType.toLowerCase();
    return ev.includes("earn") || ev.includes("result");
  });

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Earnings Calendar</div>
        <h1 className="headline">
          Quarterly prints & <span>guidance tones</span>.
        </h1>
        <p className="subtext">Parsed SEBI quarterly announcements & EPS surprises.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Quarterly Filings</div>
            <h3>Earnings Results ({earningsSignals.length})</h3>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th>Quarter</th>
                <th>EPS Win Rate</th>
                <th>Guidance Tone</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {earningsSignals.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "32px", color: "var(--text-tertiary)" }}>
                    No active earnings announcement signals in database.
                  </td>
                </tr>
              ) : (
                earningsSignals.map((item) => (
                  <tr key={item.id}>
                    <td><span className="ticker-pill">{item.ticker}</span></td>
                    <td><strong>{item.company}</strong></td>
                    <td>Q4 (Latest)</td>
                    <td>
                      <span style={{ color: "var(--tone-green)", fontWeight: 700 }}>
                        {item.backtestStats?.winRate ? `🎯 ${item.backtestStats.winRate}%` : "Not Available"}
                      </span>
                    </td>
                    <td>
                      <span className={`status-chip ${item.sentiment === "positive" ? "positive" : item.sentiment === "mixed" ? "mixed" : "risk"}`}>
                        {item.sentiment.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="footnote">{item.eventSummary}</span>
                    </td>
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
