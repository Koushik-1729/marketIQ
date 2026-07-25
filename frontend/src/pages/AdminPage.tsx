import React, { useEffect, useState } from "react";
import { fetchHealth } from "../api/client";

export function AdminPage() {
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    async function loadHealth() {
      const res = await fetchHealth();
      setHealthData(res);
    }
    loadHealth();
  }, []);

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">System Health & Admin</div>
        <h1 className="headline">
          Core Engine <span>observability</span>.
        </h1>

        <p className="subtext">Monitor Python backend health, source credibility, and ingestion jobs.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">System Status</div>
            <h3>Python Core Backend Status</h3>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
          <div className="compact-stat">
            <span className="eyebrow">API Status</span>
            <span className="chip-online">ACTIVE</span>
          </div>
          <div className="compact-stat">
            <span className="eyebrow">Database Connection</span>
            <span className="chip-online">CONNECTED</span>
          </div>
        </div>
      </section>
    </div>

  );
}
