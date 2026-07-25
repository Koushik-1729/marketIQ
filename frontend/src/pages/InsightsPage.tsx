import React, { useState } from "react";
import { SourceCitationModal } from "../components/SourceCitationModal";
import { BacktestBadge } from "../components/BacktestBadge";

type CardCategory = "ALL" | "EARNINGS" | "ORDER" | "DEAL" | "CORPORATE_ACTION" | "NEWS";

const TABS: { label: string; value: CardCategory }[] = [
  { label: "All Insights", value: "ALL" },
  { label: "Earnings", value: "EARNINGS" },
  { label: "Orders", value: "ORDER" },
  { label: "Deals", value: "DEAL" },
  { label: "Corporate Actions", value: "CORPORATE_ACTION" },
  { label: "News", value: "NEWS" }
];

export function InsightsPage() {
  const [activeCategory, setActiveCategory] = useState<CardCategory>("ALL");

  const mockCards = [
    {
      id: "card_1",
      ticker: "ABB",
      companyName: "ABB India",
      cardType: "ORDER",
      headline: "ABB Receives Major Industrial Automation Order",
      summary: "ABB India secures high-value automation contract in power sector expansion.",
      sentiment: "positive",
      confidence: 0.85,
      impactScore: 78,
      source: "NSE Announcement",
      publishedAt: new Date().toISOString()
    },
    {
      id: "card_2",
      ticker: "SBIN",
      companyName: "State Bank of India",
      cardType: "EARNINGS",
      headline: "Q4 Net Profit Jumps on Robust Asset Quality",
      summary: "SBI reports strong margin expansion and lower NPA provisions for the quarter.",
      sentiment: "positive",
      confidence: 0.90,
      impactScore: 84,
      source: "Exchange Filing",
      publishedAt: new Date().toISOString()
    }
  ];

  const filteredCards = mockCards.filter(
    (c) => activeCategory === "ALL" || c.cardType === activeCategory
  );

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Intelligence Feed</div>
        <h1 className="headline">
          Market cards with an <span className="text-highlight">operator-first</span> read.
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "20px" }}>
        {filteredCards.map((card) => (
          <div key={card.id} className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="ticker-pill">{card.ticker}</span>
                <span className="status-chip positive">{card.cardType}</span>
              </div>
              <BacktestBadge stats={{ winRate: 84.5, sampleSize: 38, timeframeDays: 30, avgPriceChange: 3.4, eventType: card.cardType }} />
            </div>

            <h3 style={{ fontSize: "16px", color: "#ffffff", margin: 0 }}>{card.headline}</h3>
            <p className="footnote" style={{ margin: 0 }}>{card.summary}</p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid rgba(192, 115, 206, 0.15)" }}>
              <span className="footnote">{new Date(card.publishedAt).toLocaleDateString()}</span>
              <SourceCitationModal
                citation={{
                  quote: card.summary,
                  sourceTitle: card.source,
                  publishedAt: card.publishedAt,
                  credibilityScore: 0.94
                }}
                sourceName={card.source}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
