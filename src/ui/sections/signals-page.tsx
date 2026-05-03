import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { SignalTable } from "@/ui/components/signal-table";

function shortText(text: string, max = 124) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function SignalsPage() {
  const report = await getLatestReport();
  const strongestSignals = report.topHighConfidenceSignals.slice(0, 3);
  const riskSignals = report.riskAlerts.slice(0, 5);
  const chartSignals = report.topHighConfidenceSignals.slice(0, 6);
  const averageScore =
    report.topHighConfidenceSignals.length > 0
      ? Math.round(
          report.topHighConfidenceSignals.reduce((sum, signal) => sum + signal.finalScore, 0) /
            report.topHighConfidenceSignals.length
        )
      : 0;

  return (
    <div className="page-stack">
      <section className="hero-panel signals-hero-compact">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow">Signals</div>
            <h1 className="page-title">
              Ranked setups, conflict checks, and <span className="text-highlight">reason-level clarity</span>.
            </h1>
            <p className="subtext">
              This is the live operating feed: the highest-conviction names, the why behind
              them, and the exceptions you should not ignore.
            </p>
          </div>

          <div className="hero-side hero-summary-grid">
            <div className="compact-stat">
              <span className="eyebrow">Tracked</span>
              <strong>{report.topHighConfidenceSignals.length}</strong>
              <span className="footnote">ranked signals</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Strong</span>
              <strong>
                {report.topHighConfidenceSignals.filter((signal) => signal.finalScore >= 80).length}
              </strong>
              <span className="footnote">top-tier setups</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Average</span>
              <strong>{averageScore}</strong>
              <span className="footnote">desk score</span>
            </div>
            <div className="compact-stat">
              <span className="eyebrow">Risk</span>
              <strong>{report.riskAlerts.length}</strong>
              <span className="footnote">needs caution</span>
            </div>
          </div>
        </div>
      </section>

      <section className="signal-grid">
        <div className="glass-card panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Ranked feed</div>
              <h3>Signal table</h3>
            </div>
          </div>
          <SignalTable signals={report.topHighConfidenceSignals} />
        </div>

        <div className="list-stack">
          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Lead names</div>
                <h3>Highest conviction cards</h3>
              </div>
            </div>
            <div className="signal-stack">
              {strongestSignals.map((signal) => (
                <article key={signal.id} className="signal-card">
                  <div className="signal-card-header">
                    <div>
                      <span className="ticker-pill">{signal.ticker}</span>
                      <h3 style={{ marginTop: 12 }}>{signal.company}</h3>
                    </div>
                    <span className={signal.finalScore >= 75 ? "score" : "score warn"}>
                      {signal.finalScore}
                    </span>
                  </div>
                  <div className="signal-meta" style={{ marginTop: 14 }}>
                    <span
                      className={`status-chip ${
                        signal.sentiment === "positive"
                          ? "positive"
                          : signal.sentiment === "mixed"
                            ? "mixed"
                            : "risk"
                      }`}
                    >
                      {signal.sentiment}
                    </span>
                    <span className="metric-chip">{signal.priorityLevel}</span>
                  </div>
                  <div className="footnote" style={{ marginTop: 14 }}>
                    {shortText(signal.eventSummary)}
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Engine posture</div>
                <h3>Confidence mix</h3>
              </div>
            </div>
            <div className="mini-chart">
              {chartSignals.map((signal) => (
                <span
                  key={signal.id}
                  style={{ height: `${Math.max(26, Math.round(signal.confidence * 100))}%` }}
                  title={`${signal.ticker} ${Math.round(signal.confidence * 100)}%`}
                />
              ))}
            </div>
            <div className="toolbar" style={{ marginTop: 16 }}>
              {chartSignals.map((signal) => (
                <span key={signal.id} className="metric-chip">
                  {signal.ticker}
                </span>
              ))}
            </div>
          </div>

          <div className="glass-card panel panel-tight">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Conflict layer</div>
                <h3>Signals to double-check</h3>
              </div>
            </div>
            <div className="list-stack">
              {riskSignals.map((signal) => (
                <div key={signal.id} className="list-item">
                  <strong>{signal.ticker}</strong>
                  <div className="footnote">{shortText(signal.conflictReason ?? signal.eventSummary, 102)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
