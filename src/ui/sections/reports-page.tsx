import { getLatestReport } from "@/application/use-cases/get-latest-report";

function shortText(text: string, max = 88) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function ReportsPage() {
  const report = await getLatestReport();
  const generatedTime = new Date(report.generatedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="report-grid">
          <div className="hero-copy">
            <div className="eyebrow">Reports</div>
            <h1 className="page-title">
              A proper morning brief, built from <span className="text-highlight">live engine output</span>.
            </h1>
            <p className="subtext">
              This page turns the raw signal engine into something readable at speed: market posture,
              focus names, personalized watchlist overlap, and smart-money context.
            </p>
            <div className="hero-kpis">
              <div className="hero-kpi">
                <span className="eyebrow">Generated</span>
                <strong>{generatedTime}</strong>
                <span className="footnote">latest compiled brief</span>
              </div>
            <div className="hero-kpi">
              <span className="eyebrow">Market mood</span>
              <strong>{report.marketMood}</strong>
              <span className="footnote">
                {report.dataStatus === "live" ? "current engine posture" : "waiting for live backend data"}
              </span>
            </div>
            </div>
          </div>

          <div className="board-card">
            <div className="eyebrow">Desk counters</div>
            <div className="stats-grid" style={{ marginTop: 16 }}>
              <div className="stat-card">
                <div className="stat-value">{report.topHighConfidenceSignals.length}</div>
                <div className="eyebrow">Signals</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{report.watchlistAlerts.length}</div>
                <div className="eyebrow">Watchlist</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{report.riskAlerts.length}</div>
                <div className="eyebrow">Risk</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{report.sectorMomentum.length}</div>
                <div className="eyebrow">Sectors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="premium-report">
          <div className="toolbar">
            <span className="metric-chip">FII {report.institutionalFlow.fiiNet} Cr</span>
            <span className="metric-chip">DII {report.institutionalFlow.diiNet} Cr</span>
            <span className="metric-chip">{report.institutionalFlow.status}</span>
          </div>

          <div className="premium-grid" style={{ marginTop: 22 }}>
            <div>
              <h2 className="section-title" style={{ marginTop: 0 }}>
                Morning operator brief
              </h2>
              <p className="subtext" style={{ marginTop: 12, maxWidth: 520 }}>
                {report.topHighConfidenceSignals.length} ranked signals, {report.watchlistAlerts.length} watchlist
                matches, and {report.riskAlerts.length} risk overrides surfaced from the latest cycle.
              </p>
            </div>

            <div className="board-card">
              <div className="eyebrow">Focus list</div>
              <div className="report-list" style={{ marginTop: 14 }}>
                {report.topHighConfidenceSignals.slice(0, 4).map((signal) => (
                  <div key={signal.id} className="report-row">
                    <div>
                      <strong>{signal.ticker}</strong>
                      <div className="footnote">{shortText(signal.eventSummary, 82)}</div>
                    </div>
                    <span className="score">{signal.finalScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="list-stack">
          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Watchlist block</div>
                <h3>Personalized names</h3>
              </div>
            </div>
            <div className="signal-stack">
              {report.watchlistAlerts.slice(0, 5).map((signal) => (
                <article key={signal.id} className="signal-card signal-card-compact">
                  <div className="signal-card-header">
                    <div>
                      <strong>{signal.ticker}</strong>
                      <div className="footnote">{shortText(signal.eventSummary, 74)}</div>
                    </div>
                    <span className="metric-chip">{signal.finalScore}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Sector pulse</div>
                <h3>Momentum leaders</h3>
              </div>
            </div>
            <div className="mini-board-list">
              {report.sectorMomentum.slice(0, 5).map((sector) => (
                <div key={sector.sector} className="mini-board-row">
                  <div>
                    <strong>{sector.sector}</strong>
                    <div className="footnote">latest sector momentum snapshot</div>
                  </div>
                  <span className="metric-chip">{sector.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Risk block</div>
              <h3>Mixed signals and caution names</h3>
            </div>
          </div>
          <div className="feed-stack">
            {report.riskAlerts.slice(0, 6).map((signal) => (
              <div key={signal.id} className="feed-item">
                <div className="feed-icon negative">↓</div>
                <div>
                  <strong>{signal.ticker}</strong>
                  <div className="footnote">{shortText(signal.conflictReason ?? signal.eventSummary, 100)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Smart money</div>
              <h3>Block and bulk deal tape</h3>
            </div>
          </div>
          <div className="mini-board-list">
            {report.recentDeals.slice(0, 6).map((deal, idx) => (
              <div key={`${deal.ticker}-${idx}`} className="mini-board-row">
                <div>
                  <strong>{deal.ticker}</strong>
                  <div className="footnote">
                    {deal.buyer !== "Unknown" ? `Bought by ${deal.buyer}` : `Sold by ${deal.seller}`}
                  </div>
                </div>
                <span className="metric-chip">{deal.signalImpact}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
