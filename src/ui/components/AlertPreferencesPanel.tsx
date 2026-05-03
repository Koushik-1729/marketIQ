"use client";

import { useEffect, useState } from "react";

type AlertSettings = {
  telegramEnabled: boolean;
  telegramChatId: string | null;
  globalAlerts: boolean;
};

type Props = {
  userId: string;
};

export function AlertPreferencesPanel({ userId }: Props) {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    fetch(`/api/alert-settings?userId=${userId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSettings(json.data.settings);
      });
  }, [userId]);

  async function save(patch: Partial<AlertSettings>) {
    if (!settings) return;
    setSaving(true);
    const next = { ...settings, ...patch };
    setSettings(next);

    const res = await fetch(`/api/alert-settings?userId=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });

    setSaving(false);
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus("idle"), 2500);
  }

  if (!settings) {
    return <div className="footnote" style={{ padding: "24px" }}>Loading alert preferences…</div>;
  }

  return (
    <div className="signal-card" style={{ maxWidth: "540px" }}>
      <div className="signal-card-header">
        <div>
          <div className="eyebrow">Delivery</div>
          <h3 style={{ margin: 0 }}>Alert Preferences</h3>
        </div>
        <span className="status-chip">Telegram</span>
      </div>

      <p className="subtext" style={{ margin: "12px 0 20px" }}>
        Configure how MarketIQ sends you real-time alerts.
      </p>

      {/* Telegram Enable Toggle */}
      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", cursor: "pointer" }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: "2px" }}>Telegram Alerts</div>
          <div className="footnote">Enable real-time alerts via Telegram</div>
        </div>
        <input
          type="checkbox"
          checked={settings.telegramEnabled}
          onChange={(e) => save({ telegramEnabled: e.target.checked })}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
        />
      </label>

      {/* Chat ID Input */}
      <div style={{ marginBottom: "18px" }}>
        <label style={{ display: "block", fontWeight: 600, marginBottom: "6px" }}>
          Telegram Chat ID
        </label>
        <div className="footnote" style={{ marginBottom: "8px" }}>
          Get your Chat ID by messaging{" "}
          <a
            href="https://t.me/userinfobot"
            target="_blank"
            rel="noopener noreferrer"
            className="footnote"
            style={{ textDecoration: "underline" }}
          >
            @userinfobot
          </a>{" "}
          on Telegram.
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <input
            type="text"
            placeholder="e.g. 123456789"
            defaultValue={settings.telegramChatId ?? ""}
            id="telegram-chat-id-input"
            style={{
              flex: 1,
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid var(--line)",
              color: "var(--text)",
              padding: "8px 12px",
              borderRadius: "6px",
              fontSize: "0.9rem"
            }}
          />
          <button
            className="status-chip positive"
            style={{ cursor: "pointer", padding: "8px 16px", border: "none" }}
            onClick={() => {
              const val = (document.getElementById("telegram-chat-id-input") as HTMLInputElement)?.value;
              save({ telegramChatId: val || null });
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Global Alerts Toggle */}
      <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px", cursor: "pointer" }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: "2px" }}>Global High-Impact Alerts</div>
          <div className="footnote">
            Receive alerts for major market events even if the ticker is not in your watchlist
            (Impact Score ≥ 85)
          </div>
        </div>
        <input
          type="checkbox"
          checked={settings.globalAlerts}
          onChange={(e) => save({ globalAlerts: e.target.checked })}
          style={{ width: "20px", height: "20px", cursor: "pointer" }}
        />
      </label>

      {/* Info block */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid var(--line)",
          borderRadius: "8px",
          padding: "14px",
          fontSize: "0.82rem"
        }}
      >
        <div className="eyebrow" style={{ fontSize: "0.65rem", marginBottom: "8px" }}>Alert Rules</div>
        <ul style={{ margin: 0, padding: "0 0 0 16px", lineHeight: "1.8" }}>
          <li><b>Watchlist alerts</b>: Sent for any high-impact card (Score ≥ 75, Rating ≥ 4) for stocks you follow.</li>
          <li><b>Global alerts</b>: Sent for exceptionally high-impact market events (Score ≥ 85) regardless of watchlist.</li>
          <li>Duplicate alerts are always suppressed.</li>
        </ul>
      </div>

      {/* Save status */}
      {status !== "idle" && (
        <div className={`status-chip ${status === "saved" ? "positive" : "risk"}`} style={{ marginTop: "14px", display: "inline-block" }}>
          {saving ? "Saving…" : status === "saved" ? "✓ Saved" : "✕ Error saving"}
        </div>
      )}
    </div>
  );
}
