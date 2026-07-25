import React, { useEffect, useState } from "react";
import { AppShell, NavTab } from "./components/AppShell";
import { fetchSignals } from "./api/client";
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
  const pageSize = 10;

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

  function handleSearch(q: string) {
    setSearchQuery(q);
    setPage(1); // Reset to page 1 on search
  }

  return (
    <AppShell activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <OverviewPage signals={signals} />}
      {activeTab === "signals" && (
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
      )}
      {activeTab === "earnings" && <EarningsPage />}
      {activeTab === "radar" && <RadarPage />}
      {activeTab === "insights" && <InsightsPage />}
      {activeTab === "reports" && <ReportsPage />}
      {activeTab === "watchlist" && <WatchlistPage />}
      {activeTab === "admin" && <AdminPage />}
    </AppShell>
  );
}

export default App;
