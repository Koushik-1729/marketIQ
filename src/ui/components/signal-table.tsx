import type { MarketSignal } from "@/domain/entities/signal";

type SignalTableProps = {
  signals: MarketSignal[];
};

function scoreClass(score: number) {
  if (score >= 75) return "score";
  if (score >= 60) return "score warn";
  return "score risk";
}

function sentimentClass(sentiment: MarketSignal["sentiment"]) {
  if (sentiment === "positive") return "status-chip positive";
  if (sentiment === "mixed") return "status-chip mixed";
  return "status-chip risk";
}

function displayEvent(signal: MarketSignal) {
  if (signal.eventType === "other" && signal.narrativeState === "persisted") {
    return {
      title: "validated signal",
      subtitle: "live cluster"
    };
  }

  return {
    title: signal.eventType.replace(/_/g, " "),
    subtitle: signal.narrativeState
  };
}

function shortSummary(signal: MarketSignal) {
  const firstReason = signal.explanation.reasons[0];
  if (firstReason && firstReason.length <= 88) {
    return firstReason;
  }

  return signal.eventSummary.length > 96
    ? `${signal.eventSummary.slice(0, 93)}...`
    : signal.eventSummary;
}

export function SignalTable({ signals }: SignalTableProps) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Event</th>
            <th>Impact</th>
            <th>Confidence</th>
            <th>Signal Tone</th>
            <th>Why In Focus</th>
          </tr>
        </thead>
        <tbody>
          {signals.map((signal) => {
            const event = displayEvent(signal);

            return (
            <tr key={signal.id}>
              <td>
                <span className="ticker-pill">{signal.ticker}</span>
                <div className="company-line muted">{signal.company}</div>
              </td>
              <td>
                <strong>{event.title}</strong>
                <div className="muted">{event.subtitle}</div>
              </td>
              <td>
                <span className={scoreClass(signal.impactScore)}>{signal.impactScore}</span>
              </td>
              <td>
                <div className="confidence-meter">
                  <div className="confidence-track">
                    <span style={{ width: `${Math.round(signal.confidence * 100)}%` }} />
                  </div>
                  <strong>{Math.round(signal.confidence * 100)}%</strong>
                </div>
              </td>
              <td>
                <span className={sentimentClass(signal.sentiment)}>
                  {signal.sentiment} · {signal.riskLevel}
                </span>
              </td>
              <td>
                <strong>{shortSummary(signal)}</strong>
                <div className="muted section">
                  {signal.explanation.reasons.slice(0, 2).join(" · ")}
                </div>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
  );
}
