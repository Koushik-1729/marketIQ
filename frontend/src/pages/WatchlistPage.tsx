import React, { useState, useEffect } from "react";
import { Signal } from "../components/SignalTable";

type WatchlistPageProps = {
  signals: Signal[];
};

export function WatchlistPage({ signals }: WatchlistPageProps) {
  const [tickers, setTickers] = useState<string[]>([]);
  const [newTicker, setNewTicker] = useState("");

  // Initialize tracked tickers dynamically from backend database signals
  useEffect(() => {
    if (signals && signals.length > 0) {
      const activeTickers = Array.from(new Set(signals.map((s) => s.ticker.toUpperCase())));
      setTickers(activeTickers);
    }
  }, [signals]);

  function handleAddTicker(e: React.FormEvent) {
    e.preventDefault();
    if (!newTicker.trim()) return;
    const clean = newTicker.trim().toUpperCase();
    if (!tickers.includes(clean)) {
      setTickers([...tickers, clean]);
    }
    setNewTicker("");
  }

  function handleRemove(t: string) {
    setTickers(tickers.filter((item) => item !== t));
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Personal Watchlist</div>
        <h1 className="headline">
          Personalized alert <span>radar</span>.
        </h1>
        <p className="subtext">Custom ticker tracking with customized risk tolerance.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Watchlist Management</div>
            <h3>Tracked Tickers ({tickers.length})</h3>
          </div>
        </div>

        <form onSubmit={handleAddTicker} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <input
            type="text"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value)}
            placeholder="Add ticker (e.g. RELIANCE)..."
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRadius: "10px",
              background: "#ffffff",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              outline: "none"
            }}
          />
          <button type="submit" className="ph-btn-primary">
            + Add Ticker
          </button>
        </form>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {tickers.length === 0 ? (
            <div style={{ color: "var(--text-tertiary)", fontSize: "13px" }}>
              Watchlist is empty. Add a ticker above to track.
            </div>
          ) : (
            tickers.map((t) => (
              <div
                key={t}
                className="ticker-pill"
                style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px" }}
              >
                <span>{t}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(t)}
                  style={{ background: "none", border: "none", color: "var(--tone-rose)", cursor: "pointer", fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
