import React from "react";
import { SignalTable, Signal } from "../components/SignalTable";

type SignalsPageProps = {
  signals: Signal[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  loading: boolean;
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (newPage: number) => void;
};

export function SignalsPage({
  signals,
  searchQuery,
  onSearchChange,
  loading,
  page,
  totalPages,
  totalCount,
  onPageChange
}: SignalsPageProps) {
  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="hero-grid">
          <div>
            <div className="eyebrow">Signals Feed</div>
            <h1 className="headline">
              Ranked setups, conflict checks, and <span className="text-highlight">reason clarity</span>.
            </h1>
            <p className="subtext">
              Literature-backed Reciprocal Rank Fusion (RRF k=60) hybrid search engine running in Python.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div className="eyebrow">RRF Hybrid Search</div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search ticker (e.g. ABB, SBIN)..."
              style={{
                padding: "12px 20px",
                borderRadius: "999px",
                background: "rgba(192, 115, 206, 0.12)",
                border: "1px solid rgba(192, 115, 206, 0.35)",
                color: "#ffffff",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
        </div>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Signals Table</div>
            <h3>Ranked Feed ({totalCount})</h3>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#C073CE" }}>
            ⚡ Loading signals from Python FastAPI backend...
          </div>
        ) : (
          <SignalTable
            signals={signals}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        )}
      </section>
    </div>
  );
}
