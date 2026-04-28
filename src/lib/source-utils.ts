import { simpleHash } from "@/lib/hash";

export { simpleHash };

export type RawPayloadFormat = "html" | "json" | "xml" | "text";

export function stripMarkup(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLikelyTickers(text: string) {
  const matches = text.match(/\b[A-Z][A-Z0-9&.-]{1,14}\b/g) ?? [];
  const blocked = new Set([
    "NSE",
    "BSE",
    "IST",
    "API",
    "JSON",
    "HTML",
    "RSS",
    "TV18",
    "DII",
    "FII"
  ]);

  return Array.from(new Set(matches.filter((match) => !blocked.has(match)))).slice(0, 6);
}

export function buildDocumentId(sourceName: string, url: string, publishedAt: string) {
  return `raw_${simpleHash(`${sourceName}:${url}:${publishedAt}`)}`;
}

export function deriveSourceReliabilityScore(sourceName: string) {
  switch (sourceName) {
    case "NSE Filing":
    case "BSE Announcement":
      return 10;
    case "Reuters Markets":
      return 9;
    case "Economic Times":
    case "Business Standard":
    case "CNBC TV18":
      return 8;
    case "Moneycontrol":
      return 7;
    case "Stocktwits":
      return 4;
    default:
      return 5;
  }
}
