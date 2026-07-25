import React from "react";

export function RadarPage() {
  const deals = [
    { ticker: "ABB", dealType: "BULK", buyer: "Goldman Sachs", value: "₹240 Cr", date: "Today" },
    { ticker: "TATACONSUM", dealType: "BLOCK", buyer: "Morgan Stanley", value: "₹180 Cr", date: "Yesterday" }
  ];

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div className="eyebrow">Insider Radar</div>
        <h1 className="headline">
          Block & Bulk deals <span className="text-highlight">flow radar</span>.
        </h1>
        <p className="subtext">Tracking institutional accumulation & promoter filings.</p>
      </section>

      <section className="glass-card">
        <div className="panel-title">
          <div>
            <div className="eyebrow">Deals Tracker</div>
            <h3>Institutional Transactions</h3>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Deal Type</th>
                <th>Buyer / Institution</th>
                <th>Deal Value</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => (
                <tr key={deal.ticker}>
                  <td><span className="ticker-pill">{deal.ticker}</span></td>
                  <td><span className="status-chip positive">{deal.dealType}</span></td>
                  <td><strong>{deal.buyer}</strong></td>
                  <td><strong style={{ color: "#C073CE" }}>{deal.value}</strong></td>
                  <td><span className="footnote">{deal.date}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
