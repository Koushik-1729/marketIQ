import React from "react";

export function EarningsPage() {
  const earningsList = [
    { ticker: "SBIN", company: "State Bank of India", quarter: "Q4", surprise: "+4.2%", tone: "POSITIVE", source: "NSE" },
    { ticker: "TATACONSUM", company: "Tata Consumer Products", quarter: "Q4", surprise: "+2.1%", tone: "NEUTRAL", source: "BSE" },
    { ticker: "BANKBARODA", company: "Bank of Baroda", quarter: "Q4", surprise: "+5.8%", tone: "POSITIVE", source: "NSE" }
  ];

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Earnings Calendar</div>
        <h1 className="headline">
          Quarterly prints & <span className="text-highlight">guidance tones</span>.
        </h1>
        <p className="subtext">Parsed SEBI quarterly announcements & EPS surprises.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Quarterly Filings</div>
            <h3>Earnings Results</h3>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Company</th>
                <th>Quarter</th>
                <th>EPS Surprise</th>
                <th>Guidance Tone</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {earningsList.map((item) => (
                <tr key={item.ticker}>
                  <td><span className="ticker-pill">{item.ticker}</span></td>
                  <td><strong>{item.company}</strong></td>
                  <td>{item.quarter}</td>
                  <td><span style={{ color: "#10b981", fontWeight: 700 }}>{item.surprise}</span></td>
                  <td><span className="status-chip positive">{item.tone}</span></td>
                  <td><span className="metric-chip">{item.source}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
