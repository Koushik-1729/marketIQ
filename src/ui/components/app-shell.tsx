import Link from "next/link";
import { navigationItems } from "@/lib/navigation";

type AppShellProps = {
  activePath: string;
  children: React.ReactNode;
};

export function AppShell({ activePath, children }: AppShellProps) {
  return (
    <div className="shell">
      <div className="container app-shell">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">∿</div>
            <div className="brand-copy">
              <div className="brand-title">Signal Intelligence</div>
              <div className="brand-subtitle">AI market desk</div>
            </div>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">Workspace</div>
            <nav className="nav">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${activePath === item.href ? "active" : ""}`}
                >
                  <span className="nav-link-main">
                    <span>{item.icon}</span>
                    {item.label}
                  </span>
                  <span className="nav-link-kicker">{item.kicker}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="sidebar-section">
            <div className="sidebar-label">System</div>
            <div className="sidebar-card">
              <strong>08:15 AM pre-market brief</strong>
              <div className="footnote">Daily trader-ready delivery.</div>
            </div>
            <div className="sidebar-card">
              <strong>Evidence-first engine</strong>
              <div className="footnote">Signals are clustered before delivery.</div>
            </div>
          </div>

          <div className="sidebar-cta">
            <strong>Morning brief</strong>
            <div className="footnote">8:15 AM IST</div>
            <div style={{ marginTop: 14 }}>
              <Link href="/reports" className="sidebar-button">
                Open brief
              </Link>
            </div>
          </div>
        </aside>

        <main className="main-stage">
          <header className="topbar">
            <div className="topbar-meta">
              <div>
                <div className="topbar-title">AI Market Signal Engine</div>
                <div className="topbar-subtitle">Signals, reports, watchlists</div>
              </div>
            </div>
            <div className="topbar-actions">
              <span className="topbar-chip">Live backend</span>
              <span className="topbar-chip">Realtime workspace</span>
              <Link href="/signals" className="btn-secondary">
                Open signal feed
              </Link>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
