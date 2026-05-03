import { z } from "zod";
import type { InsightCard } from "@/domain/entities/insight-card";

// ─── Config ───────────────────────────────────────────────────────────────────

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "gemma:2b";
// CPU-only Docker inference is slow — allow up to 120s before giving up
const TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS ?? "120000", 10);

// ─── Validation ───────────────────────────────────────────────────────────────

export const gemmaInsightResultSchema = z.object({
  headline: z.string().trim().min(5).max(120),
  summary: z.string().trim().min(10).max(400),
  impactReason: z.string().trim().optional(),
  riskNote: z.string().trim().optional()
});

export type GemmaInsightResult = z.infer<typeof gemmaInsightResultSchema>;

export type GemmaEnrichInput = {
  ticker: string;
  companyName: string;
  cardType: string;
  sentiment: string;
  confidence: number;
  impactScore: number;
  ruleBasedHeadline: string;
  ruleBasedSummary: string;
  reasons: string[];
  source: string;
  publishedAt: Date;
};

// ─── Prompt Engineering ────────────────────────────────────────────────────────

const PROMPT_TEMPLATE = (input: GemmaEnrichInput) => `
You are a financial news editor. Improve the wording of this market insight card.

### RULES:
1. DO NOT invent numbers or data.
2. DO NOT give investment advice (no "Buy", "Sell", "Hold").
3. DO NOT use clickbait.
4. Keep headline UNDER 90 characters.
5. Keep summary UNDER 280 characters.
6. Use ONLY the supplied facts.
7. Output STRICT JSON only.

### INPUT DATA:
- Ticker: ${input.ticker} (${input.companyName})
- Event Type: ${input.cardType}
- Sentiment: ${input.sentiment}
- Current Headline: ${input.ruleBasedHeadline}
- Current Summary: ${input.ruleBasedSummary}
- Key Reasons: ${input.reasons.join("; ")}
- Source: ${input.source}

### OUTPUT FORMAT (JSON ONLY):
{
  "headline": "Improved news-style headline",
  "summary": "Improved professional summary paragraph",
  "impactReason": "Short note on why this matters to the market",
  "riskNote": "A cautious note if facts are weak or risks are present"
}
`.trim();

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Optionally enriches an insight card using the local Gemma model via Ollama.
 * Returns null on ANY failure (timeout, parse error, server unavailable).
 * Never throws.
 */
export async function tryGemmaEnrich(input: GemmaEnrichInput): Promise<GemmaInsightResult | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: PROMPT_TEMPLATE(input),
        stream: false,
        format: "json"
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`[Gemma] API error (${response.status}): ${errorText}`);
      return null;
    }

    const raw = (await response.json()) as { response?: string };
    const text = raw.response?.trim();

    if (!text) {
      console.warn("[Gemma] Received empty response from model");
      return null;
    }

    // Handle potential markdown fences in output
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned);

      // Validate with Zod
      const validated = gemmaInsightResultSchema.safeParse(parsed);
      if (!validated.success) {
        console.warn("[Gemma] Validation failed:", validated.error.format());
        console.debug("[Gemma] Raw response was:", text);
        return null;
      }

      return validated.data;
    } catch (parseError) {
      console.warn("[Gemma] Failed to parse JSON from response:", parseError);
      console.debug("[Gemma] Raw response was:", text);
      return null;
    }
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.warn(`[Gemma] Request timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.warn("[Gemma] Critical extractor error:", error.message);
    }
    return null;
  }
}
