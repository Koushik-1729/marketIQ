import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { getPrimaryWatchlist } from "@/application/use-cases/get-primary-watchlist";
import { getFeatureHealth } from "@/application/use-cases/get-feature-health";

export async function AdminPage() {
  const [report, watchlist, health] = await Promise.all([
    getLatestReport(),
    getPrimaryWatchlist(),
    getFeatureHealth()
  ]);

  return (
    <div className="page-stack">
      <section className="section-band">
        <div className="section-copy">
          <div className="eyebrow">Admin</div>
          <h1 className="headline">
            Quality, control, and delivery <span className="text-highlight">operations</span>.
          </h1>
          <p className="subtext">
            The control layer for monitoring ingestion, reviewing edge cases, and keeping
            dispatch quality tight before the opening bell.
          </p>
          <div className="toolbar">
            <span className="pill">Source health</span>
            <span className="metric-chip">Review queue</span>
            <span className="metric-chip">Dispatch logs</span>
          </div>
        </div>
      </section>

      <section className="admin-grid">
        <article className="stat-card">
          <div className="eyebrow">Signals</div>
          <div className="stat-value">{report.topHighConfidenceSignals.length}</div>
          <div className="footnote">ranked feed items</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Watchlist</div>
          <div className="stat-value">{watchlist.tickers.length}</div>
          <div className="footnote">tracked tickers</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Queue</div>
          <div className="stat-value">{report.riskAlerts.length}</div>
          <div className="footnote">risk review items</div>
        </article>
        <article className="stat-card">
          <div className="eyebrow">Deals</div>
          <div className="stat-value">{report.recentDeals.length}</div>
          <div className="footnote">recent smart-money events</div>
        </article>
      </section>

      <section className="split-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ops modules</div>
              <h3>Live review surface</h3>
            </div>
          </div>
          <div className="admin-stack">
            {report.topHighConfidenceSignals.slice(0, 4).map((signal) => (
              <div key={signal.id} className="admin-item">
                <strong>{signal.ticker}</strong>
                <div className="footnote">
                  {signal.priorityLevel} · {signal.confirmationCount} confirmations · {signal.sentiment}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Daily loop</div>
              <h3>Risk review queue</h3>
            </div>
          </div>
          <div className="timeline">
            {report.riskAlerts.slice(0, 3).map((signal) => (
              <div key={signal.id} className="timeline-item">
                <strong>{signal.ticker}</strong>
                <div className="footnote">{signal.conflictReason ?? signal.eventSummary}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-card panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Backend visibility</div>
            <h3>Feature health</h3>
          </div>
        </div>
        <div className="admin-grid">
          <article className="stat-card">
            <div className="eyebrow">Report</div>
            <div className="stat-value">{health.services.latestReport.topSignals}</div>
            <div className="footnote">{health.services.latestReport.status}</div>
          </article>
          <article className="stat-card">
            <div className="eyebrow">Calendar</div>
            <div className="stat-value">{health.services.earningsCalendar.upcomingCount}</div>
            <div className="footnote">{health.services.earningsCalendar.status}</div>
          </article>
          <article className="stat-card">
            <div className="eyebrow">Radar</div>
            <div className="stat-value">{health.services.insiderRadar.itemCount}</div>
            <div className="footnote">{health.services.insiderRadar.status}</div>
          </article>
          <article className="stat-card">
            <div className="eyebrow">Signals</div>
            <div className="stat-value">{health.services.signalStore.itemCount}</div>
            <div className="footnote">{health.services.signalStore.status}</div>
          </article>
        </div>
      </section>
    </div>
  );
}
