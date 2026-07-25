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
              Ranked setups, conflict checks, and <span>reason clarity</span>.
            </h1>
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
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none"
              }}
            />
          </div>
        </div>
      </section>

      <section className="glass-card" style={{ position: "relative" }}>
        <div className="panel-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div className="eyebrow">Signals Table</div>
            <h3>Ranked Feed ({totalCount})</h3>
          </div>
          {loading && (
            <span style={{ fontSize: "13px", color: "var(--sky-blue)", fontWeight: 600 }}>
              🔄 Fetching updates...
            </span>
          )}
        </div>

        <div style={{ opacity: loading ? 0.6 : 1, transition: "opacity 0.15s ease" }}>
          <SignalTable
            signals={signals}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={onPageChange}
          />
        </div>
      </section>
    </div>
  );
}
