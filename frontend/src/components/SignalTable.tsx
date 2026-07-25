import React from "react";
import { BacktestBadge, BacktestStats } from "./BacktestBadge";
import { SourceCitationModal, SourceCitation } from "./SourceCitationModal";

export type Signal = {
  id: string;
  ticker: string;
  company: string;
  eventType: string;
  eventSummary: string;
  sentiment: string;
  confidence: number;
  impactScore: number;
  finalScore: number;
  riskLevel: string;
  explanation?: {
    reasons?: string[];
  };
  sources?: string[];
  sourceUrls?: string[];
  pdfUrls?: string[];
  citation?: SourceCitation;
  backtestStats?: BacktestStats;
};

type SignalTableProps = {
  signals: Signal[];
  page?: number;
  totalPages?: number;
  totalCount?: number;
  limit?: number;
  onPageChange?: (newPage: number) => void;
};

function scoreClass(score: number) {
  if (score >= 75) return "score";
  if (score >= 60) return "score warn";
  return "score risk";
}

function sentimentClass(sentiment: string) {
  if (sentiment === "positive") return "status-chip positive";
  if (sentiment === "mixed") return "status-chip mixed";
  return "status-chip risk";
}

function shortSummary(signal: Signal) {
  const firstReason = signal.explanation?.reasons?.[0];
  if (firstReason && firstReason.length <= 88) {
    return firstReason;
  }
  return signal.eventSummary.length > 96
    ? `${signal.eventSummary.slice(0, 93)}...`
    : signal.eventSummary;
}

export function SignalTable({
  signals,
  page = 1,
  totalPages = 1,
  totalCount = 0,
  limit = 10,
  onPageChange
}: SignalTableProps) {
  const startIdx = totalCount > 0 ? (page - 1) * limit + 1 : 0;
  const endIdx = Math.min(page * limit, totalCount);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Event & Accuracy</th>
              <th>Impact</th>
              <th>Confidence</th>
              <th>Signal Tone</th>
              <th>Why In Focus</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {signals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "32px", color: "#a78bfa" }}>
                  No signals found matching your search.
                </td>
              </tr>
            ) : (
              signals.map((signal) => (
                <tr key={signal.id}>
                  <td>
                    <span className="ticker-pill">{signal.ticker}</span>
                    <div className="company-line footnote">{signal.company}</div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <strong>{signal.eventType.replace(/_/g, " ")}</strong>
                      <BacktestBadge stats={signal.backtestStats} />
                    </div>
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
                    <div className="footnote" style={{ marginTop: "4px" }}>
                      {signal.explanation?.reasons?.slice(0, 2).join(" · ") || signal.eventSummary}
                    </div>
                  </td>
                  <td>
                    <SourceCitationModal
                      citation={signal.citation}
                      sourceName={signal.sources?.[0]}
                      sourceUrl={signal.sourceUrls?.[0]}
                      pdfUrl={signal.pdfUrls?.[0]}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Controls */}
      {onPageChange && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 18px",
            background: "rgba(16, 10, 30, 0.8)",
            border: "1px solid rgba(192, 115, 206, 0.2)",
            borderRadius: "12px",
            fontSize: "13px",
            color: "#e9d5ff"
          }}
        >
          <div className="footnote">
            Showing <strong style={{ color: "#fff" }}>{startIdx}</strong> - <strong style={{ color: "#fff" }}>{endIdx}</strong> of{" "}
            <strong style={{ color: "#fff" }}>{totalCount}</strong> signals
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="ph-btn-secondary"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                opacity: page <= 1 ? 0.4 : 1,
                cursor: page <= 1 ? "not-allowed" : "pointer"
              }}
            >
              ◀ Previous
            </button>

            <span style={{ fontWeight: 700, fontSize: "13px" }}>
              Page {page} of {totalPages}
            </span>

            <button
              type="button"
              className="ph-btn-secondary"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              style={{
                padding: "6px 14px",
                fontSize: "12px",
                opacity: page >= totalPages ? 0.4 : 1,
                cursor: page >= totalPages ? "not-allowed" : "pointer"
              }}
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
