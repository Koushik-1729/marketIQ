import React, { useState } from "react";
import { SourceCitationModal } from "../components/SourceCitationModal";
import { BacktestBadge } from "../components/BacktestBadge";
import { Signal } from "../components/SignalTable";

type CardCategory = "ALL" | "EARNINGS" | "ORDER" | "DEAL" | "CORPORATE_ACTION";

const TABS: { label: string; value: CardCategory }[] = [
  { label: "All Insights", value: "ALL" },
  { label: "Earnings", value: "EARNINGS" },
  { label: "Orders", value: "ORDER" },
  { label: "Deals", value: "DEAL" },
  { label: "Corporate Actions", value: "CORPORATE_ACTION" }
];

type InsightsPageProps = {
  signals: Signal[];
};

export function InsightsPage({ signals }: InsightsPageProps) {
  const [activeCategory, setActiveCategory] = useState<CardCategory>("ALL");

  // Map backend signals cleanly to insight cards
  const derivedCards = signals.map((s) => {
    let type: CardCategory = "CORPORATE_ACTION";
    const evLower = s.eventType.toLowerCase();
    
    if (evLower.includes("earn") || evLower.includes("result")) {
      type = "EARNINGS";
    } else if (evLower.includes("order") || evLower.includes("contract")) {
      type = "ORDER";
    } else if (evLower.includes("deal") || evLower.includes("bulk") || evLower.includes("block")) {
      type = "DEAL";
    }

    return {
      id: s.id,
      ticker: s.ticker,
      companyName: s.company,
      cardType: type,
      headline: `${s.ticker}: ${s.eventType.replace(/_/g, " ").toUpperCase()}`,
      summary: s.eventSummary,
      sentiment: s.sentiment,
      confidence: s.confidence,
      impactScore: s.impactScore,
      publishedAt: s.citation?.publishedAt || new Date().toISOString(),
      source: s.citation?.sourceTitle || "Exchange Announcement",
      citation: s.citation,
      backtestStats: s.backtestStats
    };
  });

  const filteredCards = derivedCards.filter(
    (c) => activeCategory === "ALL" || c.cardType === activeCategory
  );

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Intelligence Feed</div>
        <h1 className="headline">
          Market cards with an <span>operator-first</span> read.
        </h1>
        <p className="subtext">Organized card surface for earnings, deals, and orders.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Categories</div>
            <h3>Insight Filters</h3>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`nav-pill ${activeCategory === tab.value ? "active" : ""}`}
              onClick={() => setActiveCategory(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {filteredCards.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-tertiary)" }}>
          No active insights found for this category.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
          {filteredCards.map((card) => (
            <div key={card.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className="ticker-pill">{card.ticker}</span>
                  <span className="status-chip positive">{card.cardType}</span>
                </div>
                <BacktestBadge stats={card.backtestStats} />
              </div>

              <h3 style={{ fontSize: "16px", color: "var(--text-primary)", margin: 0 }}>{card.headline}</h3>
              <p className="footnote" style={{ margin: 0 }}>{card.summary}</p>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                <span className="footnote">{new Date(card.publishedAt).toLocaleDateString()}</span>
                <SourceCitationModal
                  citation={card.citation}
                  sourceName={card.source}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
