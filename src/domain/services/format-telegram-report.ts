import type { LatestReport } from "@/application/dto/latest-report";

export function formatTelegramReport(report: LatestReport): string {
  let text = `📊 <b>PRE-MARKET INTELLIGENCE REPORT</b>\n`;
  text += `🕣 8:30 AM IST\n\n`;

  text += `🧠 <b>Market Mood:</b> ${report.marketMood}\n\n`;

  text += `🔥 <b>Top Signals:</b>\n`;
  if (report.topHighConfidenceSignals.length === 0) {
    text += `No high confidence signals today.\n`;
  } else {
    report.topHighConfidenceSignals.slice(0, 5).forEach((signal, index) => {
      text += `${index + 1}. <b>${signal.ticker}</b> | Score: ${signal.finalScore} | Risk: ${signal.riskLevel}\n`;
      signal.explanation.reasons.slice(0, 2).forEach((reason) => {
        text += `   • ${reason}\n`;
      });
    });
  }
  text += `\n`;

  text += `📈 <b>Sector Momentum:</b>\n`;
  report.sectorMomentum.slice(0, 3).forEach((sector) => {
    text += `${sector.sector}: ${sector.status}\n`;
  });
  text += `\n`;

  text += `💰 <b>Institutional Flow:</b>\n`;
  text += `FII: ₹${report.institutionalFlow.fiiNet} Cr\n`;
  text += `DII: ₹${report.institutionalFlow.diiNet} Cr\n`;
  text += `Status: ${report.institutionalFlow.status.replace(/_/g, " ")}\n\n`;

  text += `🏦 <b>Smart Money:</b>\n`;
  if (report.recentDeals.length === 0) {
    text += `No major block deals.\n`;
  } else {
    report.recentDeals.slice(0, 3).forEach((deal) => {
      const actor = deal.buyer !== "Unknown" ? `Bought by ${deal.buyer}` : `Sold by ${deal.seller}`;
      text += `<b>${deal.ticker}</b>: ${actor}\n`;
    });
  }
  text += `\n`;

  if (report.riskAlerts.length > 0) {
    text += `⚠️ <b>Risk Alerts:</b>\n`;
    report.riskAlerts.slice(0, 3).forEach((risk) => {
      text += `<b>${risk.ticker}</b>: ${risk.conflictReason ?? "Institutional selling/Conflict detected"}\n`;
    });
    text += `\n`;
  }

  text += `<i>Disclaimer:\nThis is market information, not financial advice.</i>`;

  return text;
}
