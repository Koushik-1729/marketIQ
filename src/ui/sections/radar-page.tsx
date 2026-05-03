import { getInsiderRadar } from "@/application/use-cases/get-insider-radar";
import { getFeatureHealth } from "@/application/use-cases/get-feature-health";

function shortText(text: string, max = 104) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function RadarPage() {
  const [radar, health] = await Promise.all([
    getInsiderRadar({ limit: 18 }),
    getFeatureHealth()
  ]);

  const healthCards = [
    ["Report", health.services.latestReport.status, health.services.latestReport.topSignals],
    ["Calendar", health.services.earningsCalendar.status, health.services.earningsCalendar.upcomingCount],
    ["Radar", health.services.insiderRadar.status, health.services.insiderRadar.itemCount],
    ["Signal store", health.services.signalStore.status, health.services.signalStore.itemCount]
  ] as const;

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Radar</div>
            <h1 className="page-title">
              Insider flow, promoter activity, and signal-backed <span className="text-highlight">watch surfaces</span>.
            </h1>
            <p className="subtext">
              This takes the backend radar layer and turns it into a real monitoring surface:
              what moved, which names matter, and whether supporting market data is healthy.
            </p>
          </div>

          <div className="hero-side hero-summary-grid">
            <div className="compact-stat">
              <span className="eyebrow">Radar items</span>
              <strong>{radar.total}</strong>
              <span className="footnote">current detections</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Backend</span>
              <strong>{health.services.insiderRadar.status}</strong>
              <span className="footnote">radar API state</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Deal flow</span>
              <strong>{health.services.dealFlow.itemCount}</strong>
              <span className="footnote">supporting smart-money records</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Signals</span>
              <strong>{health.services.signalStore.itemCount}</strong>
              <span className="footnote">engine-backed records</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Insider radar</div>
              <h3>Latest detected names</h3>
            </div>
          </div>
          <div className="signal-stack">
            {radar.items.length > 0 ? (
              radar.items.map((item) => (
                <article key={item.signalId} className="signal-card">
                  <div className="signal-card-header">
                    <div>
                      <span className="ticker-pill">{item.ticker}</span>
                      <h3 style={{ marginTop: 12 }}>{item.companyName}</h3>
                    </div>
                    <span className="score">{item.score}</span>
                  </div>
                  <div className="signal-meta" style={{ marginTop: 14 }}>
                    <span className="metric-chip">{item.direction}</span>
                    <span className="metric-chip">{item.riskLevel} risk</span>
                    <span className="metric-chip">{Math.round(item.confidence * 100)}% conf</span>
                  </div>
                  <div className="footnote" style={{ marginTop: 14 }}>
                    {shortText(item.summary)}
                  </div>
                  {item.supportingDeal ? (
                    <div className="reason-row" style={{ marginTop: 14 }}>
                      <span className="reason-pill">{item.supportingDeal.dealType}</span>
                      <span className="reason-pill">{item.supportingDeal.dealValue}</span>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="panel-center" style={{ minHeight: 220 }}>
                <div className="eyebrow">No radar items</div>
                <div className="footnote">This fills when insider-like signals are present in the engine output.</div>
              </div>
            )}
          </div>
        </div>

        <div className="list-stack">
          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Data health</div>
                <h3>System readiness</h3>
              </div>
            </div>
            <div className="signal-stack">
              {healthCards.map(([label, status, count]) => (
                <div key={label} className="mini-signal-row">
                  <div>
                    <strong>{label}</strong>
                    <div className="footnote">{status}</div>
                  </div>
                  <span className="metric-chip">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Why flagged</div>
                <h3>Reason snippets</h3>
              </div>
            </div>
            <div className="feed-stack">
              {radar.items.slice(0, 6).map((item) => (
                <div key={`${item.signalId}-reason`} className="feed-item">
                  <div className="feed-icon neutral">•</div>
                  <div>
                    <strong>{item.ticker}</strong>
                    <div className="footnote">
                      {shortText(item.reasons.join(" · ") || item.summary, 98)}
                    </div>
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
