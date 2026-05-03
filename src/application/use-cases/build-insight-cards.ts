import { engineRuntime } from "@/application/runtime/engine-runtime";
import type { EngineSignal } from "@/domain/entities/engine-signal";
import type { InsightCardType } from "@/domain/entities/insight-card";
import { buildInsightCard } from "@/domain/services/build-insight-card";
import { tryGemmaEnrich } from "@/domain/services/local-gemma-extractor";
import { sendInsightAlerts } from "@/application/use-cases/send-insight-alerts";
import { isValidTicker } from "@/domain/services/ticker-validator";

/**
 * For each EngineSignal that has no InsightCard yet:
 * 1. Check EarningsEvent + DealEvent tables to sharpen cardType
 * 2. Build a rule-based InsightCard
 * 3. Optionally enrich headline/summary with local Gemma (non-blocking)
 * 4. Persist the card
 */
export async function buildInsightCards(signals: EngineSignal[]): Promise<void> {
  if (signals.length === 0) return;

  const jobStartTime = new Date();
  const enableGemma = process.env.ENABLE_GEMMA === "true";
  const tickers = [...new Set(signals.map((s) => s.ticker))];

  const [earningsByTicker, dealsByTicker] = await Promise.all([
    loadEarningsByTicker(tickers),
    loadDealsByTicker(tickers)
  ]);

  for (const signal of signals) {
    // ── GATE: skip signals with invalid tickers (secondary defence) ───────────
    if (!isValidTicker(signal.ticker)) {
      console.log(`[build-insight-cards] skipped invalid ticker: ${signal.ticker}`);
      continue;
    }

    try {
      // ── Dedup ─────────────────────────────────────────────────────────────
      const alreadyExists = await engineRuntime.insightCardRepository.existsBySignalId(signal.id);
      if (alreadyExists) continue;

      // ── Determine overrides from related models ───────────────────────────
      const overrides: Parameters<typeof buildInsightCard>[1] = {};
      const hasEarnings = earningsByTicker.has(signal.ticker);
      const hasDeals = dealsByTicker.has(signal.ticker);

      if (hasEarnings) {
        const earnings = earningsByTicker.get(signal.ticker)!;
        overrides.cardType = "EARNINGS" as InsightCardType;
        overrides.source = earnings.source;
        overrides.sourceUrl = earnings.sourceUrl;
        overrides.publishedAt = new Date(earnings.earningsDate);
      }

      if (hasDeals && !hasEarnings) {
        const deal = dealsByTicker.get(signal.ticker)!;
        overrides.cardType = "DEAL" as InsightCardType;
        overrides.source = deal.source;
        overrides.publishedAt = new Date(deal.dealDate);
      }

      // ── Build rule-based card ─────────────────────────────────────────────
      let card = buildInsightCard(signal, overrides);

      // ── Optional Gemma enrichment ─────────────────────────────────────────
      if (enableGemma) {
        const enriched = await tryGemmaEnrich({
          ticker: card.ticker,
          companyName: card.companyName,
          cardType: card.cardType,
          sentiment: card.sentiment,
          confidence: card.confidence,
          impactScore: card.impactScore,
          ruleBasedHeadline: card.headline,
          ruleBasedSummary: card.summary,
          reasons: signal.explanation.reasons,
          source: card.source,
          publishedAt: card.publishedAt
        });

        if (enriched) {
          card = {
            ...card,
            headline: enriched.headline,
            summary: enriched.summary
            // Note: If schema supported impactReason/riskNote, we would append them here.
          };
          console.log(`[build-insight-cards] Gemma enrichment success for ${card.ticker}`);
        } else {
          console.log(`[build-insight-cards] Gemma enrichment failed, fallback used for ${card.ticker}`);
        }
      } else {
        console.log(`[build-insight-cards] Gemma enrichment skipped for ${card.ticker}`);
      }

      // ── Persist ───────────────────────────────────────────────────────────
      await engineRuntime.insightCardRepository.create(card);
    } catch (error) {
      console.warn(`[build-insight-cards] failed for signal ${signal.id}`, error);
    }
  }

  // ── Send alerts for cards generated in this run ───────────────────────────
  try {
    await sendInsightAlerts(
      {
        insightCardRepository: engineRuntime.insightCardRepository,
        userAlertPreferencesRepository: engineRuntime.userAlertPreferencesRepository,
        alertLogRepository: engineRuntime.alertLogRepository,
        telegramAdapter: engineRuntime.telegramAdapter
      },
      { since: jobStartTime }
    );
  } catch (error) {
    console.warn("[build-insight-cards] Alert dispatch failed (non-fatal):", error);
  }
}

// ─── Batch loaders ────────────────────────────────────────────────────────────

async function loadEarningsByTicker(tickers: string[]) {
  const map = new Map<string, { source: string; sourceUrl: string; earningsDate: string }>();
  try {
    const rows = await engineRuntime.earningsEventRepository.findLatestByTickers(tickers);
    for (const row of rows) {
      if (!map.has(row.ticker)) {
        map.set(row.ticker, {
          source: row.source,
          sourceUrl: row.sourceUrl,
          earningsDate: row.earningsDate
        });
      }
    }
  } catch {}
  return map;
}

async function loadDealsByTicker(tickers: string[]) {
  const map = new Map<string, { source: string; dealDate: string }>();
  try {
    for (const ticker of tickers) {
      const deals = await engineRuntime.dealEventRepository.findRecentByTicker(ticker, 1);
      if (deals.length > 0) {
        map.set(ticker, {
          source: deals[0].source,
          dealDate: deals[0].dealDate
        });
      }
    }
  } catch {}
  return map;
}
