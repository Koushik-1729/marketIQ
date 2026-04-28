import { getDashboardData } from "@/application/use-cases/get-dashboard-data";

const savedInterests = ["RELIANCE", "INFY", "HDFCBANK", "Capital Goods", "IT", "Policy"];

function shortText(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function WatchlistsPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="page-stack">
      <section className="hero-panel watch-grid">
        <div className="hero-copy">
          <div className="eyebrow">Watchlists</div>
          <h1 className="page-title">A curated signal queue for each user.</h1>
          <p className="subtext">
            Personalization blends ticker priority, sectors, themes, freshness,
            and alert control.
          </p>
          <div className="toolbar">
            {savedInterests.map((interest) => (
              <span key={interest} className="pill">
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className="hero-side">
          <div className="highlight-card">
            <div className="eyebrow">Top score</div>
            <div className="metric-value">{dashboard.watchlistSignals[0]?.impactScore ?? 0}</div>
            <div className="footnote">best personalized match</div>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ranking logic</div>
              <h3>How it decides</h3>
            </div>
          </div>
          <div className="dashboard-map">
            <div className="map-node">
              <strong>Tickers</strong>
              <div className="footnote">Exact match priority</div>
            </div>
            <div className="map-node">
              <strong>Sectors</strong>
              <div className="footnote">Theme expansion</div>
            </div>
            <div className="map-node">
              <strong>Freshness</strong>
              <div className="footnote">Recent signals first</div>
            </div>
            <div className="map-node">
              <strong>Fatigue</strong>
              <div className="footnote">Suppress weak repeats</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ranked queue</div>
              <h3>Personalized picks</h3>
            </div>
          </div>
          <div className="signal-stack">
            {dashboard.watchlistSignals.map((signal) => (
              <article key={signal.id} className="signal-card signal-card-compact">
                <div className="signal-card-header">
                  <div>
                    <h3>{signal.ticker}</h3>
                    <div className="footnote">{signal.company}</div>
                  </div>
                  <span className="score">{signal.impactScore}</span>
                </div>
                <div className="signal-meta">
                  <span className="metric-chip">{signal.sector}</span>
                  <span className="metric-chip">{signal.riskLevel} risk</span>
                </div>
                <div className="footnote">{shortText(signal.eventSummary)}</div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
