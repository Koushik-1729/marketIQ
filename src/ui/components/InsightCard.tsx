import type { InsightCard as InsightCardType } from "@/domain/entities/insight-card";

type InsightCardProps = {
  card: InsightCardType;
};

export function InsightCard({ card }: InsightCardProps) {
  const sentimentClass =
    card.sentiment === "positive"
      ? "positive"
      : card.sentiment === "negative"
        ? "risk"
        : card.sentiment === "mixed"
          ? "mixed"
          : "";

  return (
    <article className="insight-card" id={`card-${card.id}`}>
      <div className="signal-card-header">
        <div>
          <div className="toolbar">
            <span className="ticker-pill">{card.ticker}</span>
            <span className={`status-chip ${sentimentClass}`}>{card.cardType.replace(/_/g, " ")}</span>
          </div>
          <h3 style={{ marginTop: 14 }}>{card.headline}</h3>
          <div className="footnote" style={{ marginTop: 8 }}>
            {card.companyName}
          </div>
        </div>
        <div className={`score ${card.sentiment === "negative" ? "risk" : card.sentiment === "mixed" ? "warn" : ""}`}>
          {card.impactScore}
        </div>
      </div>

      <p className="subtext" style={{ margin: 0 }}>
        {card.summary}
      </p>

      <div className="signal-meta">
        <div className="metric-chip">
          <span className="eyebrow">rating</span>
          <span className="rating-line">
            {"★".repeat(card.rating)}
            {"☆".repeat(5 - card.rating)}
          </span>
        </div>

        <div className="metric-chip">
          <span className="eyebrow">confidence</span>
          <div className="confidence-meter">
            <div className="confidence-track" style={{ width: 70 }}>
              <span style={{ width: `${card.confidence * 100}%` }} />
            </div>
            <span>{Math.round(card.confidence * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="signal-card-header" style={{ marginTop: "auto" }}>
        <div className="footnote">{new Date(card.publishedAt).toLocaleString()}</div>
        {card.pdfUrl ? (
          <a href={card.pdfUrl} target="_blank" rel="noopener noreferrer" className="metric-chip">
            View Filing
          </a>
        ) : card.sourceUrl ? (
          <a href={card.sourceUrl} target="_blank" rel="noopener noreferrer" className="metric-chip">
            View Source
          </a>
        ) : (
          <span className="metric-chip">{card.source}</span>
        )}
      </div>
    </article>
  );
}
