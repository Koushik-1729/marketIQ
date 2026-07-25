import React, { useState } from "react";

export type SourceCitation = {
  quote: string;
  sourceTitle: string;
  sourceUrl?: string;
  pdfUrl?: string;
  publishedAt: string;
  credibilityScore?: number;
};

type SourceCitationModalProps = {
  citation?: SourceCitation;
  sourceName?: string;
  sourceUrl?: string | null;
  pdfUrl?: string | null;
};

export function SourceCitationModal({
  citation,
  sourceName,
  sourceUrl,
  pdfUrl
}: SourceCitationModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const quoteText = citation?.quote || "Extracted raw corporate announcement document chunk.";
  const titleText = citation?.sourceTitle || sourceName || "Exchange Announcement / News Feed";
  const link = citation?.pdfUrl || pdfUrl || citation?.sourceUrl || sourceUrl;

  return (
    <>
      <button
        type="button"
        className="metric-chip"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          color: "#fff",
          cursor: "pointer",
          fontSize: "12px",
          padding: "4px 10px",
          borderRadius: "6px",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px"
        }}
        onClick={() => setIsOpen(true)}
      >
        <span>📑 View Citation</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px"
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: "12px",
              maxWidth: "560px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              color: "#e6edf3"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", color: "#58a6ff" }}>Source Citation & Audit Evidence</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#8b949e",
                  fontSize: "20px",
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: "13px", color: "#8b949e", marginBottom: "12px" }}>
              <strong>Source:</strong> {titleText}
            </div>

            <blockquote
              style={{
                margin: "0 0 16px 0",
                padding: "12px 16px",
                borderLeft: "4px solid #238636",
                backgroundColor: "rgba(35, 134, 54, 0.1)",
                borderRadius: "4px",
                fontSize: "13px",
                lineHeight: "1.5",
                color: "#c9d1d9"
              }}
            >
              "{quoteText}"
            </blockquote>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "20px" }}>
              {citation?.credibilityScore && (
                <span style={{ fontSize: "12px", color: "#7ee787" }}>
                  Source Credibility: {Math.round(citation.credibilityScore * 100)}%
                </span>
              )}

              {link ? (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: "#238636",
                    color: "#ffffff",
                    padding: "6px 14px",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "12px",
                    fontWeight: 600
                  }}
                >
                  Open Original Document ↗
                </a>
              ) : (
                <span style={{ fontSize: "12px", color: "#8b949e" }}>Direct link unavailable</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
