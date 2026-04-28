import { getLatestReport } from "@/application/use-cases/get-latest-report";

function shortText(text: string, max = 84) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function ReportsPage() {
  const report = await getLatestReport();

  return (
    <div className="page-stack">
      <section className="hero-panel report-grid">
        <div className="hero-copy">
          <div className="eyebrow">Reports</div>
          <h1 className="page-title">The 8:15 AM market brief.</h1>
          <p className="subtext">
            A cleaner delivery surface for global cues, top signals, risk events,
            and personalized watchlist focus.
          </p>
          <div className="toolbar">
            <span className="pill">{report.marketMood}</span>
            <span className="metric-chip">FII Net: {report.institutionalFlow.fiiNet} Cr</span>
            <span className="metric-chip">DII Net: {report.institutionalFlow.diiNet} Cr</span>
          </div>
        </div>

        <div className="hero-side">
          <div className="overview-dual-grid">
            <div className="highlight-card">
              <div className="eyebrow">Generated</div>
              <div className="metric-value">
                {new Date(report.generatedAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </div>
              <div className="footnote">pre-market delivery timestamp</div>
            </div>
            <div className="panel panel-center">
              <div className="eyebrow">Focus count</div>
              <div className="stat-value">{report.topHighConfidenceSignals.length}</div>
              <div className="footnote">high conviction stocks</div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="eyebrow">Risk events</div>
          <div className="stat-value">{report.riskAlerts.length}</div>
          <div className="footnote">high risk overrides</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Watchlist picks</div>
          <div className="stat-value">{report.watchlistAlerts.length}</div>
          <div className="footnote">personalized highlights</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Channel mode</div>
          <div className="stat-value">4</div>
          <div className="footnote">delivery surfaces</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Schedule</div>
          <div className="stat-value">08:15</div>
          <div className="footnote">morning dispatch</div>
        </article>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Focus list</div>
              <h3>Top signal cards</h3>
            </div>
          </div>
          <div className="signal-stack">
            {report.topHighConfidenceSignals.map((signal) => (
              <article key={signal.id} className="signal-card signal-card-compact">
                <div className="signal-card-header">
                  <div>
                    <h3>{signal.ticker}</h3>
                    <div className="footnote">
                      {signal.priorityLevel} · {signal.confirmationCount} confirmations
                    </div>
                  </div>
                  <span className="score">{signal.finalScore}</span>
                </div>
                <div className="footnote" style={{ marginTop: 8 }}>{shortText(signal.eventSummary, 96)}</div>
                <div className="reason-row" style={{ marginTop: 8 }}>
                  {signal.explanation.reasons.slice(0, 2).map((reason) => (
                    <span key={reason} className="reason-pill">
                      {reason}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="list-stack">
          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Risk block</div>
                <h3>Mixed signals</h3>
              </div>
            </div>
            <div className="list-stack">
              {report.riskAlerts.map((signal) => (
                <div key={signal.id} className="list-item">
                  <strong>{signal.ticker}</strong>
                  <div className="footnote" style={{ color: "var(--red)" }}>
                    RISK: {signal.conflictReason ?? "Institutional selling or contradiction"}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Watchlist block</div>
                <h3>Personalized picks</h3>
              </div>
            </div>
            <div className="list-stack">
              {report.watchlistAlerts.map((signal) => (
                <div key={signal.id} className="list-item list-item-grid">
                  <div>
                    <strong>{signal.ticker}</strong>
                    <div className="footnote">{shortText(signal.eventSummary, 74)}</div>
                  </div>
                  <div className="list-item-side">
                    <span className="score">{signal.finalScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Smart Money</div>
                <h3>Block & Bulk Deals</h3>
              </div>
            </div>
            <div className="list-stack">
              {report.recentDeals.slice(0, 5).map((deal, idx) => (
                <div key={idx} className="list-item list-item-grid">
                  <div>
                    <strong>{deal.ticker}</strong>
                    <div className="footnote">
                      {deal.buyer !== "Unknown" ? `Bought by ${deal.buyer}` : `Sold by ${deal.seller}`}
                    </div>
                  </div>
                  <div className="list-item-side">
                    <span className="status-chip positive">{deal.signalImpact}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
