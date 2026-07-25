import React from "react";

type ReportsPageProps = {
  report: string;
};

export function ReportsPage({ report }: ReportsPageProps) {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Premarket Reports</div>
        <h1 className="headline">
          Daily synthesized <span>desk intelligence</span>.
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

        <div style={{ 
          background: "var(--bg-deep)", 
          padding: "24px", 
          borderRadius: "12px", 
          border: "1px solid var(--border-subtle)",
          whiteSpace: "pre-wrap",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
          lineHeight: "1.7",
          color: "var(--text-secondary)"
        }}>
          {report}
        </div>
      </section>
    </div>
  );
}
