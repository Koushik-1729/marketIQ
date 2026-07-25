import React, { useState } from "react";
import { triggerSignalScan } from "../api/client";

export type NavTab = "overview" | "signals" | "earnings" | "radar" | "insights" | "reports" | "watchlist" | "admin";

type AppShellProps = {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  children: React.ReactNode;
};

const NAV_ITEMS: { id: NavTab; label: string; icon: string }[] = [
  { id: "overview", label: "Overview", icon: "◈" },
  { id: "signals", label: "Signals", icon: "↑" },
  { id: "earnings", label: "Earnings", icon: "●" },
  { id: "radar", label: "Radar", icon: "◎" },
  { id: "insights", label: "Insights", icon: "✦" },
  { id: "reports", label: "Reports", icon: "▤" },
  { id: "watchlist", label: "Watchlist", icon: "◐" },
  { id: "admin", label: "Admin", icon: "⚙" }
];

export function AppShell({ activeTab, onTabChange, children }: AppShellProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    { role: "assistant", text: "Hello! I am your AI Market Analyst. Ask me anything about current stock setups, filings, or institutional flows." }
  ]);
  const [chatInput, setChatInput] = useState("");

  async function handleRunScan() {
    setIsScanning(true);
    try {
      await triggerSignalScan();
      window.location.reload();
    } catch (err) {
      console.error("Signal scan failed:", err);
    } finally {
      setIsScanning(false);
    }
  }

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Analysis for "${userMsg}": High conviction setup detected with RRF Hybrid rank #1. Monitor order win announcements & volume confirmation.`
        }
      ]);
    }, 600);
  }

  return (
    <div className="shell">
      <div className="page-frame">
        {/* Top Marquee Ticker Bar */}
        <div className="ticker-tape-bar">
          <div className="ticker-tape-label">
            <span>⚡ LIVE TICKER</span>
          </div>
          <div className="ticker-tape-content">
            <div className="ticker-item">
              <strong>ABB</strong> <span style={{ color: "#10b981" }}>Score 64</span> <span style={{ fontSize: 11, opacity: 0.7 }}>(80% conf)</span>
            </div>
            <div className="ticker-item">
              <strong>TATACONSUM</strong> <span style={{ color: "#10b981" }}>Score 64</span> <span style={{ fontSize: 11, opacity: 0.7 }}>(80% conf)</span>
            </div>
            <div className="ticker-item">
              <strong>BANKBARODA</strong> <span style={{ color: "#10b981" }}>Score 64</span> <span style={{ fontSize: 11, opacity: 0.7 }}>(80% conf)</span>
            </div>
            <div className="ticker-item">
              <strong>SBIN</strong> <span style={{ color: "#10b981" }}>Score 62</span> <span style={{ fontSize: 11, opacity: 0.7 }}>(65% conf)</span>
            </div>
          </div>
        </div>

        {/* Navigation Header */}
        <header className="topnav">
          <div className="brand">
            <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => onTabChange("overview")}>
              <div className="brand-mark">⚡</div>
              <div>
                <div className="brand-title">MarketIQ AI</div>
              </div>
            </div>

            <nav className="topnav-nav" style={{ marginLeft: 16 }}>
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-pill ${activeTab === item.id ? "active" : ""}`}
                  onClick={() => onTabChange(item.id)}
                >
                  <span style={{ fontSize: 13 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="topnav-actions">
            <div className="chip-online">
              <span className="chip-dot-green" />
              <span>Python Engine Live</span>
            </div>
            <button
              type="button"
              onClick={handleRunScan}
              disabled={isScanning}
              className="ph-btn-primary"
              style={{ padding: "8px 18px", fontSize: 13, cursor: isScanning ? "wait" : "pointer" }}
            >
              {isScanning ? "🔄 Scanning..." : "+ Run Signal Scan"}
            </button>
          </div>
        </header>

        <main>{children}</main>

        {/* Footer */}
        <footer style={{ marginTop: 60, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b" }}>
          <span><strong style={{ color: "white" }}>MarketIQ AI</strong> · Pure React SPA + Python FastAPI Core Backend</span>
          <span>Powered by LangGraph, Python 3.11 & PostgreSQL</span>
        </footer>

        {/* Floating AI Assistant Drawer */}
        <button
          type="button"
          className="ai-assistant-fab"
          onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
        >
          <span>🤖 Ask AI Analyst</span>
        </button>

        {aiDrawerOpen && (
          <div className="ai-chat-drawer">
            <div className="ai-chat-header">
              <strong style={{ color: "#E9D5FF" }}>🤖 MarketIQ AI Analyst</strong>
              <button
                type="button"
                onClick={() => setAiDrawerOpen(false)}
                style={{ background: "none", border: "none", color: "#a78bfa", cursor: "pointer", fontSize: 18 }}
              >
                ✕
              </button>
            </div>
            <div className="ai-chat-messages">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`ai-chat-msg ${msg.role}`}>
                  {msg.text}
                </div>
              ))}
            </div>
            <form onSubmit={handleSendChat} className="ai-chat-input-row">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about ticker, filings or signals..."
                className="ai-chat-input"
              />
              <button type="submit" className="ph-btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
