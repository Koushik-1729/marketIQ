import Link from "next/link";
import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  activePath: string;
  children: React.ReactNode;
};

export async function AppShell({ activePath, children }: AppShellProps) {
  const report = await getLatestReport();
  const generatedAt = new Date(report.generatedAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const backendStatusLabel = report.dataStatus === "live" ? "Live data" : "Data unavailable";
  const liveSignals = (report.topHighConfidenceSignals.length > 0
    ? report.topHighConfidenceSignals
    : report.watchlistAlerts
  ).slice(0, 6);
  const tickerSource =
    liveSignals.length > 0
      ? liveSignals.map((signal) => ({
          label: signal.ticker,
          value:
            signal.priceMove && signal.priceMove !== "N/A"
              ? signal.priceMove
              : `${signal.finalScore}`,
          price:
            signal.volumeRatio && signal.volumeRatio !== "N/A"
              ? signal.volumeRatio
              : `${Math.round(signal.confidence * 100)}% conf`,
          tone:
            signal.sentiment === "negative"
              ? "negative"
              : signal.sentiment === "mixed"
                ? "neutral"
                : "positive"
        }))
      : report.recentDeals.slice(0, 6).map((deal) => ({
          label: deal.ticker,
          value: deal.signalImpact,
          price: `${deal.dealType} deal`,
          tone:
            deal.signalImpact.toLowerCase().includes("bear")
              ? "negative"
              : deal.signalImpact.toLowerCase().includes("neutral")
                ? "neutral"
                : "positive"
        }));
  const tickerItems = tickerSource.map((signal) => ({
    label: signal.label,
    value: signal.value,
    price: signal.price,
    tone: signal.tone
  }));
  const tickerRow = [...tickerItems, ...tickerItems];

  return (
    <div className="shell">
      <div className="ambient-background" />
      <div className="page-frame">
        <header className="topnav">
          <div className="topnav-main">
            <Link href="/" className="brand">
              <div className="brand-mark">✦</div>
              <div className="brand-copy">
                <div className="brand-title">TracKit</div>
                <div className="brand-subtitle">AI market signal desk</div>
              </div>
            </Link>

            <nav className="topnav-nav">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill ${activePath === item.href ? "active" : ""}`}
                >
                  <span className="nav-pill-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="topnav-actions">
            <div className="topnav-status">
              <span className="chip">
                <span className="chip-dot" />
                {backendStatusLabel}
              </span>
              <span className="metric-chip">Updated {generatedAt}</span>
            </div>
            <Link href="/reports" className="metric-chip">
              Morning brief
            </Link>
          </div>
        </header>

        <section className="workspace-ribbon">
          <div className="workspace-summary">
            <div className="workspace-title">Market operating system</div>
            <div className="workspace-subtitle">
              Ranked signals, earnings context, risk exceptions, and watchlist focus in one desk.
            </div>
          </div>
          <div className="workspace-metrics">
            <div className="workspace-metric">
              <span className="workspace-label">Lead queue</span>
              <strong>{report.topHighConfidenceSignals.length}</strong>
            </div>
            <div className="workspace-metric">
              <span className="workspace-label">Watchlist</span>
              <strong>{report.watchlistAlerts.length}</strong>
            </div>
            <div className="workspace-metric">
              <span className="workspace-label">Risk flags</span>
              <strong>{report.riskAlerts.length}</strong>
            </div>
          </div>
        </section>

        <section className="ticker-marquee">
          <div className="ticker-marquee-track">
            {tickerRow.map((item, index) => (
              <div key={`${item.label}-${index}`} className="ticker-marquee-item">
                <span className="ticker-marquee-symbol">{item.label}</span>
                <span className={`ticker-marquee-change ${item.tone}`}>
                  {item.tone === "negative" ? "▼" : "▲"} {item.value}
                </span>
                <span className="ticker-marquee-price">{item.price}</span>
                <span className="ticker-marquee-dot">•</span>
              </div>
            ))}
          </div>
        </section>

        <main className="shell-main">
          {children}

          <footer className="footer">
            <span>
              TracKit <span className="text-highlight">· intelligence for the modern investor</span>
            </span>
            <span>Not financial advice · Past performance ≠ future results</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
