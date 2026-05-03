"use client";

import { useEffect, useState } from "react";
import { InsightCard } from "@/ui/components/InsightCard";
import type {
  InsightCard as InsightCardType,
  InsightCardType as CardTypeEnum
} from "@/domain/entities/insight-card";

const TABS: { label: string; value: CardTypeEnum | "ALL" }[] = [
  { label: "All Insights", value: "ALL" },
  { label: "Earnings", value: "EARNINGS" },
  { label: "Orders", value: "ORDER" },
  { label: "Deals", value: "DEAL" },
  { label: "Corporate Actions", value: "CORPORATE_ACTION" },
  { label: "Announcements", value: "ANNOUNCEMENT" }
];

export function InsightsPage() {
  const [activeTab, setActiveTab] = useState<CardTypeEnum | "ALL">("ALL");
  const [cards, setCards] = useState<InsightCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true);
      try {
        const url = activeTab === "ALL" ? "/api/insights/latest" : `/api/insights?type=${activeTab}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.success) {
          setCards(json.data.cards);
        }
      } catch (error) {
        console.error("Failed to fetch insights", error);
      } finally {
        setLoading(false);
      }
    }

    fetchInsights();
  }, [activeTab]);

  return (
    <div className="page-stack">
      <section className="section-band">
        <div className="section-copy">
          <div className="eyebrow">Intelligence feed</div>
          <h1 className="headline">
            Market cards with an <span className="text-highlight">operator-first</span> read.
          </h1>
          <p className="subtext">
            A cleaner card surface for earnings, deals, orders, and corporate updates,
            organized for fast scanning during the market session.
          </p>
        </div>
      </section>

      <section className="glass-card panel">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Filters</div>
            <h3>Insight categories</h3>
          </div>
        </div>
        <div className="insight-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`tab-button ${activeTab === tab.value ? "active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {loading ? (
        <div className="glass-card panel panel-center" style={{ minHeight: 260 }}>
          <div className="brand-mark">✦</div>
          <div className="footnote">Loading insight cards...</div>
        </div>
      ) : cards.length > 0 ? (
        <div className="insights-grid">
          {cards.map((card) => (
            <InsightCard key={card.id} card={card} />
          ))}
        </div>
      ) : (
        <div className="glass-card panel panel-center" style={{ minHeight: 260 }}>
          <div className="eyebrow">No insights found</div>
          <p className="subtext">Try another category or wait for the next engine run.</p>
        </div>
      )}
    </div>
  );
}
