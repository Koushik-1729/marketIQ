import { getUpcomingEarnings } from "@/application/use-cases/get-upcoming-earnings";
import { getEarningsHistory } from "@/application/use-cases/get-earnings-history";

function shortText(text: string, max = 96) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function EarningsPage() {
  const upcoming = await getUpcomingEarnings({ limit: 16 });
  const featuredTicker = upcoming[0]?.ticker ?? "SBIN";
  const history = await getEarningsHistory(featuredTicker, 6);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Earnings</div>
            <h1 className="page-title">
              Calendar, history, and surprise context in one <span className="text-highlight">earnings desk</span>.
            </h1>
            <p className="subtext">
              A clean product surface for what the backend already knows: upcoming earnings,
              latest conviction, beat and miss history, and quarter-by-quarter context.
            </p>
          </div>

          <div className="hero-side hero-summary-grid">
            <div className="compact-stat">
              <span className="eyebrow">Upcoming</span>
              <strong>{upcoming.length}</strong>
              <span className="footnote">scheduled events</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Featured</span>
              <strong>{history.ticker}</strong>
              <span className="footnote">history spotlight</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">EPS beat rate</span>
              <strong>{history.summary.epsBeatRate}%</strong>
              <span className="footnote">last {history.summary.totalEvents} events</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Revenue beat rate</span>
              <strong>{history.summary.revenueBeatRate}%</strong>
              <span className="footnote">last {history.summary.totalEvents} events</span>
            </div>
          </div>
        </div>
      </section>

      <section className="content-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Calendar</div>
              <h3>Upcoming earnings</h3>
            </div>
          </div>
          <div className="calendar-list">
            {upcoming.length > 0 ? (
              upcoming.map((event) => (
                <article key={`${event.ticker}-${event.earningsDate}`} className="calendar-row">
                  <div>
                    <div className="signal-card-header">
                      <strong>{event.ticker}</strong>
                      <span className="metric-chip">
                        {new Date(event.earningsDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short"
                        })}
                      </span>
                    </div>
                    <div className="footnote">{event.companyName}</div>
                    <div className="footnote">
                      {event.fiscalQuarter} FY{event.fiscalYear} · {event.source}
                    </div>
                  </div>
                  <div className="list-item-side">
                    {event.signal ? <span className="score">{event.signal.score}</span> : null}
                    <div className="footnote">
                      {event.signal ? shortText(event.signal.summary, 62) : "No linked signal yet"}
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="panel-center" style={{ minHeight: 180 }}>
                <div className="eyebrow">No live earnings data</div>
                <div className="footnote">Calendar fills when the backend has reachable earnings records.</div>
              </div>
            )}
          </div>
        </div>

        <div className="list-stack">
          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">History spotlight</div>
                <h3>{history.companyName}</h3>
              </div>
              {history.latestSignal ? <span className="score">{history.latestSignal.score}</span> : null}
            </div>
            <div className="mini-board-list">
              <div className="mini-board-row">
                <div>
                  <strong>EPS streak</strong>
                  <div className="footnote">{history.summary.epsStreak.direction}</div>
                </div>
                <span className="metric-chip">{history.summary.epsStreak.length}</span>
              </div>
              <div className="mini-board-row">
                <div>
                  <strong>Revenue streak</strong>
                  <div className="footnote">{history.summary.revenueStreak.direction}</div>
                </div>
                <span className="metric-chip">{history.summary.revenueStreak.length}</span>
              </div>
              <div className="mini-board-row">
                <div>
                  <strong>Avg EPS surprise</strong>
                  <div className="footnote">historical average</div>
                </div>
                <span className="metric-chip">
                  {history.summary.averageEpsSurprise ?? "N/A"}
                </span>
              </div>
              <div className="mini-board-row">
                <div>
                  <strong>Avg revenue surprise</strong>
                  <div className="footnote">historical average</div>
                </div>
                <span className="metric-chip">
                  {history.summary.averageRevenueSurprise ?? "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Quarter tape</div>
                <h3>Recent reported events</h3>
              </div>
            </div>
            <div className="signal-stack">
              {history.events.map((event) => (
                <div key={`${event.ticker}-${event.earningsDate}`} className="signal-card signal-card-compact">
                  <div className="signal-card-header">
                    <div>
                      <strong>
                        {event.fiscalQuarter} FY{event.fiscalYear}
                      </strong>
                      <div className="footnote">
                        {new Date(event.earningsDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </div>
                    </div>
                    <span className="metric-chip">{event.guidanceTone}</span>
                  </div>
                  <div className="signal-meta" style={{ marginTop: 12 }}>
                    <span className="metric-chip">EPS {event.epsSurprisePercent ?? "N/A"}%</span>
                    <span className="metric-chip">Revenue {event.revenueSurprisePercent ?? "N/A"}%</span>
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
