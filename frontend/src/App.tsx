import React, { useEffect, useState } from "react";
import { AppShell, NavTab } from "./components/AppShell";
import { fetchSignals, fetchLatestReport } from "./api/client";
import { Signal } from "./components/SignalTable";

import { OverviewPage } from "./pages/OverviewPage";
import { SignalsPage } from "./pages/SignalsPage";
import { EarningsPage } from "./pages/EarningsPage";
import { RadarPage } from "./pages/RadarPage";
import { InsightsPage } from "./pages/InsightsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { WatchlistPage } from "./pages/WatchlistPage";
import { AdminPage } from "./pages/AdminPage";

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [signals, setSignals] = useState<Signal[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState("Loading pre-market briefing...");
  const pageSize = 10;

  // Load signals once on mount and when query/page changes
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const offset = (page - 1) * pageSize;
        const res = await fetchSignals(searchQuery, pageSize, offset);
        setSignals(res.items);
        setTotalCount(res.totalCount);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error("Failed to load signals from Python backend:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [searchQuery, page]);

  // Load latest report from Python backend on mount
  useEffect(() => {
    async function loadReport() {
      const data = await fetchLatestReport();
      setReport(data);
    }
    loadReport();
  }, []);

  function handleSearch(q: string) {
    setSearchQuery(q);
    setPage(1); // Reset to page 1 on search
  }

  // Helper to determine display style
  const getTabStyle = (tab: NavTab) => ({
    display: activeTab === tab ? "block" : "none",
    width: "100%"
  });

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      <div 
        className="fade-in-page" 
        style={{ 
          minHeight: "650px", 
          display: "flex", 
          flexDirection: "column",
          width: "100%"
        }}
      >
        <div style={getTabStyle("overview")}>
          <OverviewPage signals={signals} />
        </div>
        
        <div style={getTabStyle("signals")}>
          <SignalsPage
            signals={signals}
            searchQuery={searchQuery}
            onSearchChange={handleSearch}
            loading={loading}
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={setPage}
          />
        </div>

        <div style={getTabStyle("earnings")}>
          <EarningsPage signals={signals} />
        </div>

        <div style={getTabStyle("radar")}>
          <RadarPage signals={signals} />
        </div>

        <div style={getTabStyle("insights")}>
          <InsightsPage signals={signals} />
        </div>

        <div style={getTabStyle("reports")}>
          <ReportsPage report={report} />
        </div>

        <div style={getTabStyle("watchlist")}>
          <WatchlistPage signals={signals} />
        </div>

        <div style={getTabStyle("admin")}>
          <AdminPage />
        </div>
      </div>
    </AppShell>
  );
}

export default App;
