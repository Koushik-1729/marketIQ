import type { InsightCard } from "@/domain/entities/insight-card";

const TELEGRAM_API = `https://api.telegram.org/bot`;
const TIMEOUT_MS = 5000;

// ─── HTML escaping ────────────────────────────────────────────────────────────
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Star rating helper ───────────────────────────────────────────────────────
function stars(rating: number): string {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

// ─── Message formatter ────────────────────────────────────────────────────────
export function formatAlertMessage(
  card: InsightCard,
  extras?: { impactReason?: string; riskNote?: string }
): string {
  const confidence = Math.round(card.confidence * 100);

  const lines: string[] = [
    `🚨 <b>MarketIQ Alert</b>`,
    ``,
    `<b>${escapeHtml(card.companyName)} (${escapeHtml(card.ticker)})</b>`,
    escapeHtml(card.headline),
    ``,
    escapeHtml(card.summary),
    ``,
    `Impact: <b>${card.impactScore}/100</b>`,
    `Confidence: <b>${confidence}%</b>`,
    `Rating: ${stars(card.rating)}`
  ];

  if (extras?.impactReason) {
    lines.push(``, `<b>Why it matters:</b>`, escapeHtml(extras.impactReason));
  }

  if (extras?.riskNote) {
    lines.push(``, `<b>Risk:</b>`, escapeHtml(extras.riskNote));
  }

  if (card.pdfUrl) {
    lines.push(``, `📄 View Filing: ${card.pdfUrl}`);
  } else if (card.sourceUrl) {
    lines.push(``, `🔗 Source: ${card.sourceUrl}`);
  }

  return lines.join("\n");
}

// ─── Adapter class ────────────────────────────────────────────────────────────
export class TelegramAdapter {
  private token: string | null;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN ?? null;
  }

  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.token) {
      console.log("[telegram] TELEGRAM_BOT_TOKEN is not set — skipping message");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${TELEGRAM_API}${this.token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: false
        }),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text();
        console.warn(`[telegram] API error for chatId=${chatId}: ${res.status} ${body}`);
      }
    } catch (error) {
      clearTimeout(timer);
      // Never crash the pipeline — just log
      console.warn(`[telegram] Failed to send to chatId=${chatId}:`, error);
    }
  }
}
