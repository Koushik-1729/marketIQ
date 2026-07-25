import React, { useState } from "react";

export function WatchlistPage() {
  const [tickers, setTickers] = useState(["ABB", "SBIN", "TATACONSUM", "BANKBARODA"]);
  const [newTicker, setNewTicker] = useState("");

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
          Personalized alert <span className="text-highlight">radar</span>.
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
              borderRadius: "999px",
              background: "rgba(192, 115, 206, 0.1)",
              border: "1px solid rgba(192, 115, 206, 0.3)",
              color: "#fff",
              outline: "none"
            }}
          />
          <button type="submit" className="ph-btn-primary">
            + Add Ticker
          </button>
        </form>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          {tickers.map((t) => (
            <div
              key={t}
              className="ticker-pill"
              style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 16px" }}
            >
              <span>{t}</span>
              <button
                type="button"
                onClick={() => handleRemove(t)}
                style={{ background: "none", border: "none", color: "#fb7185", cursor: "pointer", fontWeight: 800 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
