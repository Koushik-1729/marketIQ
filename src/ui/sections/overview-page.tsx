import Link from "next/link";
import { getLatestReport } from "@/application/use-cases/get-latest-report";

function shortText(text: string, max = 96) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function OverviewPage() {
  const report = await getLatestReport();
  const leadSignal = report.topHighConfidenceSignals[0] ?? report.watchlistAlerts[0];
  const riskRatio =
    report.topHighConfidenceSignals.length > 0
      ? Math.min(
          300,
          Math.round((report.riskAlerts.length / report.topHighConfidenceSignals.length) * 360)
        )
      : 120;

  return (
    <div className="page-stack">
      <section className="hero-panel hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Overview</div>
          <h1 className="headline">
            Market signals for the <em>opening bell</em>.
          </h1>
          <p className="subtext">
            A compact morning workspace for high-attention stocks, watchlist matches,
            and explainable risk signals.
          </p>
          <div className="toolbar">
            <span className="pill">{report.marketMood}</span>
            <span className="metric-chip">FII Net: {report.institutionalFlow.fiiNet} Cr</span>
            <span className="metric-chip">DII Net: {report.institutionalFlow.diiNet} Cr</span>
          </div>
          <div className="hero-kpis">
            <div className="hero-kpi">
              <strong>{report.topHighConfidenceSignals.length}</strong>
              <span className="footnote">high conviction</span>
            </div>
            <div className="hero-kpi">
              <strong>{report.watchlistAlerts.length}</strong>
              <span className="footnote">watchlist hits</span>
            </div>
            <div className="hero-kpi">
              <strong>
                {report.topHighConfidenceSignals.filter((signal) => signal.finalScore >= 80).length}
              </strong>
              <span className="footnote">critical alerts</span>
            </div>
          </div>
        </div>

        <div className="hero-side">
          <div className="overview-dual-grid">
            <div className="highlight-card">
              <div className="eyebrow">Lead signal</div>
              <div className="signal-card-header">
                <div>
                  <h3>{leadSignal?.ticker ?? "No signal"}</h3>
                  <div className="footnote">
                    {leadSignal ? shortText(leadSignal.eventSummary, 78) : "Awaiting refresh"}
                  </div>
                </div>
                {leadSignal ? <span className="score">{leadSignal.finalScore}</span> : null}
              </div>
              <div className="toolbar" style={{ marginTop: 14 }}>
                <span className="status-chip positive">{leadSignal?.sentiment ?? "neutral"}</span>
                <span className="metric-chip">
                  {leadSignal ? `${leadSignal.confirmationCount} confirmations` : "no data"}
                </span>
              </div>
            </div>

            <div className="panel panel-center">
              <div className="eyebrow">Risk mix</div>
              <div
                className="progress-ring"
                style={{
                  background: `radial-gradient(circle at center, #091624 56%, transparent 57%), conic-gradient(var(--teal) 0deg, var(--teal) ${360 - riskRatio}deg, rgba(255, 124, 132, 0.55) ${360 - riskRatio}deg ${360}deg)`
                }}
              >
                <strong>{report.riskAlerts.length}</strong>
              </div>
              <div className="footnote" style={{ textAlign: "center" }}>
                risk events in today&apos;s queue
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-grid">
        <article className="stat-card stat-card-featured">
          <div className="eyebrow">Macro Flow Status</div>
          <div className="stat-value">{report.institutionalFlow.status.replace(/_/g, " ")}</div>
          <div className="footnote">FII/DII combined flow conviction</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Watchlist leader</div>
          <div className="stat-value">{report.watchlistAlerts[0]?.finalScore ?? 0}</div>
          <div className="footnote">Top personalized ranking score</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Delivery window</div>
          <div className="stat-value">08:15</div>
          <div className="footnote">Pre-market morning brief</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Review queue</div>
          <div className="stat-value">{report.riskAlerts.length}</div>
          <div className="footnote">Signals with risk overrides</div>
        </article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Top stocks in focus</div>
              <h3>Morning board</h3>
            </div>
            <Link href="/signals" className="metric-chip">
              Open feed
            </Link>
          </div>
          <div className="list-stack">
            {report.topHighConfidenceSignals.slice(0, 6).map((signal) => (
              <div key={signal.id} className="list-item list-item-grid">
                <div>
                  <strong>{signal.ticker}</strong>
                  <div className="footnote">{shortText(signal.eventSummary, 88)}</div>
                </div>
                <div className="list-item-side">
                  <span className={signal.finalScore >= 75 ? "score" : signal.finalScore >= 60 ? "score warn" : "score risk"}>
                    {signal.finalScore}
                  </span>
                  <div className="footnote">{signal.priorityLevel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="list-stack">
          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Watchlist queue</div>
                <h3>Personalized focus</h3>
              </div>
            </div>
            <div className="signal-stack">
              {report.watchlistAlerts.slice(0, 4).map((signal) => (
                <article key={signal.id} className="signal-card signal-card-compact">
                  <div className="signal-card-header">
                    <div>
                      <h3>{signal.ticker}</h3>
                      <div className="footnote">{signal.company}</div>
                    </div>
                    <span className="score">{signal.finalScore}</span>
                  </div>
                  <div className="footnote">{shortText(signal.eventSummary, 78)}</div>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Channel surfaces</div>
                <h3>Delivery map</h3>
              </div>
            </div>
            <div className="dashboard-map">
              <div className="map-node">
                <strong>WhatsApp</strong>
                <div className="footnote">Fast cards</div>
              </div>
              <div className="map-node">
                <strong>Telegram</strong>
                <div className="footnote">Rich threads</div>
              </div>
              <div className="map-node">
                <strong>Email</strong>
                <div className="footnote">Full brief</div>
              </div>
              <div className="map-node">
                <strong>Dashboard</strong>
                <div className="footnote">Live workspace</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
