import Link from "next/link";
import { getLatestReport } from "@/application/use-cases/get-latest-report";

function shortText(text: string, max = 110) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function OverviewPage() {
  const report = await getLatestReport();
  const featured = report.topHighConfidenceSignals[0] ?? report.watchlistAlerts[0] ?? null;
  const liveQueue = report.topHighConfidenceSignals.slice(0, 5);
  const watchlistFocus = report.watchlistAlerts.slice(0, 4);
  const riskFlags = report.riskAlerts.slice(0, 3);
  const strikeRate =
    report.topHighConfidenceSignals.length > 0
      ? Math.round(
          (report.topHighConfidenceSignals.reduce((sum, signal) => sum + signal.confidence, 0) /
            report.topHighConfidenceSignals.length) *
            100
        )
      : 0;
  const generatedTime = new Date(report.generatedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="page-stack">
      <section className="desk-hero">
        <div className="desk-hero-main">
          <div className="eyebrow">Overview</div>
          <h1 className="headline">
            One sharp read on the market, <span className="text-highlight">before you commit capital</span>.
          </h1>
          <p className="subtext">
            This desk brings the morning together into one operator view: top conviction,
            watchlist alignment, risk exceptions, and the evidence behind each call.
          </p>

          <div className="hero-kpis">
            <div className="hero-kpi">
              <span className="eyebrow">Signal strike</span>
              <strong>{strikeRate}%</strong>
              <span className="footnote">average confidence across the lead queue</span>
            </div>
            <div className="hero-kpi">
              <span className="eyebrow">Institutional flow</span>
              <strong>{report.institutionalFlow.status}</strong>
              <span className="footnote">
                FII {report.institutionalFlow.fiiNet} Cr · DII {report.institutionalFlow.diiNet} Cr
              </span>
            </div>
            <div className="hero-kpi">
              <span className="eyebrow">Report cycle</span>
              <strong>{generatedTime}</strong>
              <span className="footnote">latest generated market brief</span>
            </div>
          </div>
        </div>

        <aside className="hero-side-panel">
          <div className="hero-side-top">
            <div>
              <div className="eyebrow">Morning posture</div>
              <div className="hero-side-value">{report.marketMood}</div>
            </div>
            <span className={`status-chip ${report.dataStatus === "live" ? "positive" : "risk"}`}>
              {report.dataStatus === "live" ? "Live" : "Unavailable"}
            </span>
          </div>

          <div className="hero-side-grid">
            <div className="hero-side-card">
              <span className="eyebrow">Gift Nifty</span>
              <strong>{report.giftNifty}</strong>
            </div>
            <div className="hero-side-card">
              <span className="eyebrow">Lead queue</span>
              <strong>{report.topHighConfidenceSignals.length}</strong>
            </div>
            <div className="hero-side-card">
              <span className="eyebrow">Watchlist</span>
              <strong>{report.watchlistAlerts.length}</strong>
            </div>
            <div className="hero-side-card">
              <span className="eyebrow">Risk flags</span>
              <strong>{report.riskAlerts.length}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="overview-board">
        <article className="featured-board">
          <div className="signal-card-header">
            <div>
              <div className="eyebrow">Top conviction</div>
              <h2 className="featured-ticker">{featured?.ticker ?? "WAIT"}</h2>
              <div className="footnote">{featured?.company ?? "Awaiting stronger market setup"}</div>
            </div>
            {featured ? <span className="score">{featured.finalScore}</span> : null}
          </div>

          <p className="featured-summary">
            {featured
              ? shortText(featured.eventSummary, 180)
              : "No leading signal is ready yet. The desk will populate as soon as the engine publishes a stronger ranked setup."}
          </p>

          {featured ? (
            <>
              <div className="featured-stat-row">
                <div className="featured-stat">
                  <span className="eyebrow">Impact</span>
                  <strong>{featured.impactScore}</strong>
                </div>
                <div className="featured-stat">
                  <span className="eyebrow">Confidence</span>
                  <strong>{Math.round(featured.confidence * 100)}%</strong>
                </div>
                <div className="featured-stat">
                  <span className="eyebrow">Priority</span>
                  <strong>{featured.priorityLevel}</strong>
                </div>
              </div>

              <div className="reason-row">
                {featured.explanation.reasons.slice(0, 4).map((reason) => (
                  <span key={reason} className="reason-pill">
                    {reason}
                  </span>
                ))}
              </div>
            </>
          ) : null}
        </article>

        <aside className="overview-side-stack">
          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Live queue</div>
                <h3>What deserves attention now</h3>
              </div>
              <Link href="/signals" className="footnote">
                open feed
              </Link>
            </div>
            <div className="feed-stack">
              {liveQueue.map((signal) => (
                <div key={signal.id} className="feed-item">
                  <div
                    className={`feed-icon ${
                      signal.sentiment === "positive"
                        ? "positive"
                        : signal.sentiment === "negative"
                          ? "negative"
                          : "neutral"
                    }`}
                  >
                    {signal.sentiment === "positive" ? "↑" : signal.sentiment === "negative" ? "↓" : "•"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="signal-card-header">
                      <strong>{signal.ticker}</strong>
                      <span className="footnote">{signal.finalScore}</span>
                    </div>
                    <div className="footnote">{shortText(signal.eventSummary, 84)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Watchlist fit</div>
                <h3>Names closest to your book</h3>
              </div>
            </div>
            <div className="mini-board-list">
              {watchlistFocus.map((signal) => (
                <div key={signal.id} className="mini-board-row">
                  <div>
                    <strong>{signal.ticker}</strong>
                    <div className="footnote">{shortText(signal.eventSummary, 68)}</div>
                  </div>
                  <span className="metric-chip">{signal.finalScore}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Decision support</div>
              <h3>Why the lead setup is holding up</h3>
            </div>
          </div>

          <div className="insight-grid">
            <div className="factor-card">
              <div className="eyebrow">Evidence</div>
              <div className="factor-value">{featured?.confirmationCount ?? 0}</div>
              <div className="footnote">corroborations across the signal graph</div>
            </div>
            <div className="factor-card">
              <div className="eyebrow">Sector</div>
              <div className="factor-value">{featured?.sector ?? "Unknown"}</div>
              <div className="footnote">current operating context for the setup</div>
            </div>
            <div className="factor-card">
              <div className="eyebrow">Narrative</div>
              <div className="factor-value">{featured?.narrativeState ?? "waiting"}</div>
              <div className="footnote">state of the model’s interpretation</div>
            </div>
          </div>

          <div className="callout" style={{ marginTop: 18 }}>
            <p className="footnote" style={{ margin: 0 }}>
              The desk is strongest when conviction, corroboration, and watchlist relevance line up.
              That’s the combination this home screen now tries to surface first.
            </p>
          </div>
        </div>

        <div className="list-stack">
          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Risk exceptions</div>
                <h3>Items needing caution</h3>
              </div>
            </div>
            <div className="list-stack">
              {riskFlags.map((signal) => (
                <div key={signal.id} className="list-item">
                  <strong>{signal.ticker}</strong>
                  <div className="footnote">{shortText(signal.conflictReason ?? signal.eventSummary, 94)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Smart money</div>
                <h3>Recent deal activity</h3>
              </div>
            </div>
            <div className="mini-board-list">
              {report.recentDeals.slice(0, 4).map((deal, index) => (
                <div key={`${deal.ticker}-${index}`} className="mini-board-row">
                  <div>
                    <strong>{deal.ticker}</strong>
                    <div className="footnote">{deal.dealType} · {deal.signalImpact}</div>
                  </div>
                  <span className="metric-chip">{deal.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
