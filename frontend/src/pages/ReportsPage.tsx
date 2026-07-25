import React from "react";

export function ReportsPage() {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Premarket Reports</div>
        <h1 className="headline">
          Daily synthesized <span className="text-highlight">desk intelligence</span>.
        </h1>
        <p className="subtext">AI generated premarket briefs with risk flags and institutional flow validation.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Latest Report</div>
            <h3>Premarket Intelligence Briefing</h3>
          </div>
        </div>

        <div style={{ background: "rgba(6, 4, 12, 0.7)", padding: "24px", borderRadius: "12px", border: "1px solid rgba(192, 115, 206, 0.2)" }}>
          <h4 style={{ color: "#E9D5FF", margin: "0 0 12px 0", fontSize: "18px" }}>Executive Summary</h4>
          <p className="subtext">
            Nifty momentum remains supportive with strong DII net inflows offset by selective FII profit-taking. High-conviction setups concentrated in capital goods (ABB) and FMCG (TATACONSUM) following solid quarterly volume trends.
          </p>

          <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
            <span className="metric-chip">FII Net: +450 Cr</span>
            <span className="metric-chip">DII Net: +820 Cr</span>
            <span className="status-chip positive">Bullish Bias</span>
          </div>
        </div>
      </section>
    </div>
  );
}
