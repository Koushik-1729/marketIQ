import type { GuidanceTone } from "@/domain/entities/earnings-event";
import type { RawDocument } from "@/domain/entities/raw-document";

type ParsedEarningsMetrics = {
  estimatedEPS: number | null;
  actualEPS: number | null;
  epsSurprisePercent: number | null;
  estimatedRevenue: number | null;
  actualRevenue: number | null;
  revenueSurprisePercent: number | null;
  hasGuidance: boolean;
  guidanceTone: GuidanceTone;
  operatingProfit: number | null;
  operatingMargin: number | null;
  netProfit: number | null;
};

function normalizeNumber(value: string | undefined) {
  if (!value) return null;
  const normalized = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(normalized) ? normalized : null;
}

function capture(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return normalizeNumber(match[1]);
    }
  }

  return null;
}

function calculateSurprise(actual: number | null, estimated: number | null) {
  if (actual === null || estimated === null || estimated === 0) {
    return null;
  }

  return Number((((actual - estimated) / estimated) * 100).toFixed(2));
}

function detectGuidanceTone(text: string): GuidanceTone {
  const hasGuidance = /guidance|outlook|forecast/.test(text);
  if (!hasGuidance) return "UNKNOWN";

  if (/raise(?:d)? guidance|strong outlook|upward guidance|improved outlook/.test(text)) {
    return "POSITIVE";
  }

  if (/cut guidance|lower guidance|weak outlook|cautious outlook/.test(text)) {
    return "NEGATIVE";
  }

  if (/maintain(?:ed)? guidance|in line outlook/.test(text)) {
    return "NEUTRAL";
  }

  return "UNKNOWN";
}

export function parseEarningsMetrics(document: RawDocument): ParsedEarningsMetrics {
  const text = `${document.title}\n${document.content}`.replace(/\s+/g, " ").toLowerCase();

  const actualEPS = capture(text, [
    /eps\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /eps at\s*([+-]?\d+(?:\.\d+)?)/i,
    /earnings per share[:\s]+([+-]?\d+(?:\.\d+)?)/i
  ]);
  const estimatedEPS = capture(text, [
    /estimated eps(?:\s*(?:rs\.?|inr)?)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /eps estimate[:\s]+([+-]?\d+(?:\.\d+)?)/i,
    /consensus eps[:\s]+([+-]?\d+(?:\.\d+)?)/i
  ]);
  const actualRevenue = capture(text, [
    /revenue\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)\s*(?:crore|cr|million|billion)?/i,
    /total income\s*(?:at|of)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /revenue grew to\s*([+-]?\d+(?:\.\d+)?)/i
  ]);
  const estimatedRevenue = capture(text, [
    /estimated revenue\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /revenue estimate[:\s]+([+-]?\d+(?:\.\d+)?)/i,
    /consensus revenue[:\s]+([+-]?\d+(?:\.\d+)?)/i
  ]);

  const hasGuidance = /guidance|outlook|forecast/.test(text);
  const guidanceTone = detectGuidanceTone(text);

  const operatingProfit = capture(text, [
    /operating profit\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /ebitda\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /op\s*(?:at|of)?\s*([+-]?\d+(?:\.\d+)?)/i
  ]);

  const operatingMargin = capture(text, [
    /operating margin[:\s]+([+-]?\d+(?:\.\d+)?)\s*%/i,
    /opm[:\s]+([+-]?\d+(?:\.\d+)?)\s*%/i,
    /ebitda margin[:\s]+([+-]?\d+(?:\.\d+)?)\s*%/i
  ]);

  const netProfit = capture(text, [
    /net profit\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /profit after tax\s*(?:rs\.?|inr)?\s*([+-]?\d+(?:\.\d+)?)/i,
    /pat\s*(?:at|of)?\s*([+-]?\d+(?:\.\d+)?)/i
  ]);

  return {
    estimatedEPS,
    actualEPS,
    epsSurprisePercent: calculateSurprise(actualEPS, estimatedEPS),
    estimatedRevenue,
    actualRevenue,
    revenueSurprisePercent: calculateSurprise(actualRevenue, estimatedRevenue),
    hasGuidance,
    guidanceTone,
    operatingProfit,
    operatingMargin,
    netProfit
  };
}
