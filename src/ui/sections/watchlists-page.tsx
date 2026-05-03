import { getDashboardData } from "@/application/use-cases/get-dashboard-data";
import { getPrimaryWatchlist } from "@/application/use-cases/get-primary-watchlist";

function shortText(text: string, max = 80) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function WatchlistsPage() {
  const [dashboard, watchlist] = await Promise.all([getDashboardData(), getPrimaryWatchlist()]);
  const savedInterests = [...watchlist.tickers, ...watchlist.sectors, ...watchlist.themes].slice(0, 6);

  return (
    <div className="page-stack">
      <section className="section-band">
        <div className="strike-header">
          <div className="section-copy">
          <div className="eyebrow">Watchlist</div>
          <h1 className="headline">
            Personalized focus with the same <span className="text-highlight">queue logic</span>.
          </h1>
          <p className="subtext">
            Priority, freshness, and watchlist relevance presented in the same premium desk
            language as the shared UI.
          </p>
            <div className="toolbar">
              {savedInterests.length > 0 ? savedInterests.map((interest) => (
                <span key={interest} className="pill">
                  {interest}
                </span>
              )) : <span className="pill">No saved interests yet</span>}
              <span className="metric-chip">{watchlist.riskTolerance} risk tolerance</span>
            </div>
          </div>

          <div className="glass-card strike-panel">
            <div className="eyebrow">Top score</div>
            <div className="metric-value">{dashboard.watchlistSignals[0]?.impactScore ?? 0}</div>
            <div className="footnote">best personalized match</div>
          </div>
        </div>
      </section>

      <section className="split-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ranking logic</div>
              <h3>How the queue decides</h3>
            </div>
          </div>
          <div className="dashboard-map">
            <div className="map-node">
              <strong>Tickers</strong>
              <div className="footnote">{watchlist.tickers.length} exact matches tracked</div>
            </div>
            <div className="map-node">
              <strong>Sectors</strong>
              <div className="footnote">{watchlist.sectors.length} sectors expanding coverage</div>
            </div>
            <div className="map-node">
              <strong>Freshness</strong>
              <div className="footnote">{dashboard.topSignals.length} recent signals ranked first</div>
            </div>
            <div className="map-node">
              <strong>Fatigue</strong>
              <div className="footnote">{watchlist.themes.length} themes shaping repeat suppression</div>
            </div>
          </div>
        </div>

        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ranked queue</div>
              <h3>Personalized picks</h3>
            </div>
          </div>
          <div className="signal-stack">
            {dashboard.watchlistSignals.map((signal) => (
              <article key={signal.id} className="signal-card">
                <div className="signal-card-header">
                  <div>
                    <span className="ticker-pill">{signal.ticker}</span>
                    <h3 style={{ marginTop: 12 }}>{signal.company}</h3>
                  </div>
                  <span className="score">{signal.impactScore}</span>
                </div>
                <div className="signal-meta" style={{ marginTop: 14 }}>
                  <span className="metric-chip">{signal.sector}</span>
                  <span className="metric-chip">{signal.riskLevel} risk</span>
                </div>
                <div className="footnote" style={{ marginTop: 14 }}>
                  {shortText(signal.eventSummary)}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
