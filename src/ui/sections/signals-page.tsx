import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { SignalTable } from "@/ui/components/signal-table";

function shortText(text: string, max = 132) {
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

export async function SignalsPage() {
  const report = await getLatestReport();
  const strongestSignals = report.topHighConfidenceSignals.slice(0, 3);
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
        <div className="eyebrow">Signals feed</div>
        <h1 className="page-title">Live signal workspace</h1>
        <p className="subtext">
          A denser operator view for ranked signal clusters, momentum, confidence,
          and conflict review.
        </p>
        <div className="signals-summary-grid">
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
            <span className="footnote">high confidence</span>
          </div>
          <div className="compact-stat">
            <span className="eyebrow">Average</span>
            <strong>{averageScore}</strong>
            <span className="footnote">impact score</span>
          </div>
          <div className="compact-stat">
            <span className="eyebrow">Risk</span>
            <strong>{report.riskAlerts.length}</strong>
            <span className="footnote">mixed events</span>
          </div>
        </div>
      </section>

      <section className="signal-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <div className="eyebrow">Signal matrix</div>
              <h3>Ranked feed</h3>
            </div>
          </div>
          <SignalTable signals={report.topHighConfidenceSignals} />
        </div>

        <div className="list-stack">
          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Top conviction</div>
                <h3>Signal spotlight</h3>
              </div>
            </div>
            <div className="signal-stack">
              {strongestSignals.map((signal) => (
                <article key={signal.id} className="signal-card signal-card-compact">
                  <div className="signal-card-header">
                    <div>
                      <h3>{signal.ticker}</h3>
                      <div className="footnote">
                        {signal.eventType === "other" ? "validated signal" : signal.eventType.replace(/_/g, " ")}
                      </div>
                    </div>
                    <span className={signal.finalScore >= 75 ? "score" : signal.finalScore >= 60 ? "score warn" : "score risk"}>
                      {signal.finalScore}
                    </span>
                  </div>
                  <div className="signal-meta">
                    <span className="status-chip positive">{signal.sentiment}</span>
                    <span className="metric-chip">{signal.priorityLevel}</span>
                    <span className="metric-chip">{signal.confirmationCount} confirmations</span>
                  </div>
                  <div className="footnote">{shortText(signal.eventSummary, 120)}</div>
                  <div className="reason-row">
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

          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Review queue</div>
                <h3>Risk and conflict layer</h3>
              </div>
            </div>
            <div className="list-stack">
              {report.riskAlerts.slice(0, 5).map((signal) => (
                <div key={signal.id} className="list-item">
                  <strong>{signal.ticker}</strong>
                  <div className="footnote">{shortText(signal.conflictReason ?? signal.eventSummary, 108)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-title">
              <div>
                <div className="eyebrow">Engine posture</div>
                <h3>Signal mix</h3>
              </div>
            </div>
            <div className="mini-chart">
              <span style={{ height: "82%" }} />
              <span style={{ height: "58%" }} />
              <span style={{ height: "91%" }} />
              <span style={{ height: "47%" }} />
              <span style={{ height: "74%" }} />
              <span style={{ height: "62%" }} />
            </div>
            <div className="toolbar" style={{ marginTop: 16 }}>
              <span className="metric-chip">Corroboration</span>
              <span className="metric-chip">Momentum</span>
              <span className="metric-chip">Conflict checks</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
