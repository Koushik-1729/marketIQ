import { BaseHttpSourceAdapter } from "@/adapters/inbound/sources/base-http-source";
import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";

type StocktwitsTrendingPayload = {
  symbols?: Array<{
    symbol?: string;
    title?: string;
    sentiment?: string;
    watchlist_count?: number;
    trending_score?: number;
    id?: number | string;
    symbol_id?: number | string;
    rank?: number;
    sector?: string;
  }>;
  messages?: Array<{
    id?: number | string;
    body?: string;
    created_at?: string;
    entities?: {
      symbols?: Array<{
        symbol?: string;
      }>;
      sentiment?: {
        basic?: string;
      };
    };
    likes?: {
      total?: number;
    };
    conversation?: {
      replies?: number;
    };
    user?: {
      username?: string;
    };
  }>;
};

function extractCashtags(body: string) {
  return Array.from(
    new Set(
      Array.from(body.matchAll(/\$([A-Z]{1,10})\b/g)).map((match) => match[1]?.toUpperCase())
    )
  ).filter((value): value is string => Boolean(value));
}

export class StocktwitsSourceAdapter
  extends BaseHttpSourceAdapter
  implements RawDocumentSourcePort
{
  private readonly apiUrl =
    process.env.STOCKTWITS_API_URL ??
    "https://api.stocktwits.com/api/2/streams/trending.json";
  private readonly maxAttempts = 3;

  private async fetchTrendingPayload() {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      try {
        const payload = await this.fetchJson<StocktwitsTrendingPayload>(this.apiUrl, {
          headers: {
            accept: "application/json, text/plain, */*",
            "accept-language": "en-US,en;q=0.9",
            origin: "https://stocktwits.com",
            referer: "https://stocktwits.com/",
            ...(process.env.STOCKTWITS_ACCESS_TOKEN
              ? {
                  Authorization: `Bearer ${process.env.STOCKTWITS_ACCESS_TOKEN}`
                }
              : {})
          }
        });

        return payload;
      } catch (error) {
        lastError = error;

        console.info(
          JSON.stringify(
            {
              source: "Stocktwits",
              url: this.apiUrl,
              attempt,
              status: "retrying",
              error: error instanceof Error ? error.message : "Unknown Stocktwits error"
            },
            null,
            2
          )
        );

        if (attempt < this.maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
        }
      }
    }

    throw lastError;
  }

  async fetchLatest(): Promise<RawDocument[]> {
    const payload = await this.fetchTrendingPayload();

    const symbols = payload.symbols ?? [];
    const messages = payload.messages ?? [];

    console.info(
      JSON.stringify(
        {
          source: "Stocktwits",
          url: this.apiUrl,
          httpStatus: 200,
          responseKeys: Object.keys(payload),
          symbolsCount: symbols.length,
          messagesCount: messages.length
        },
        null,
        2
      )
    );

    if (symbols.length > 0) {
      return symbols.slice(0, 20).map((item, index) => {
        const symbol = item.symbol?.toUpperCase() ?? "UNKNOWN";
        const title = item.title ?? `${symbol} trending on Stocktwits`;
        const trendingScore = item.trending_score ?? item.rank ?? Math.max(50, 100 - index * 3);
        const mentionCountSpike = item.watchlist_count ?? Math.max(1.5, 5 - index * 0.1);

        return this.buildRawDocument({
          sourceName: "Stocktwits",
          sourceKind: "social",
          title,
          url: `${this.apiUrl}#${symbol}`,
          content: `${title}. Trending stock mentions are rising for ${symbol}.`,
          rawPayload: JSON.stringify(item),
          rawPayloadFormat: "json",
          tickersHint: [symbol],
          metadata: {
            ticker: symbol,
            sentiment: item.sentiment ?? "neutral",
            mentionCountSpike,
            trendingScore,
            stocktwitsRank: item.rank ?? index + 1
          }
        });
      });
    }

    return messages
      .slice(0, 20)
      .flatMap((item, index) => {
        const body = item.body ?? "Stocktwits traders are discussing this symbol.";
        const entitySymbols =
          item.entities?.symbols
            ?.map((symbol) => symbol.symbol?.toUpperCase())
            .filter((symbol): symbol is string => Boolean(symbol)) ?? [];
        const cashtags = extractCashtags(body);
        const tickers = Array.from(new Set([...entitySymbols, ...cashtags])).filter(Boolean);
        const sentiment = item.entities?.sentiment?.basic ?? "neutral";
        const trendingScore = Math.max(50, (item.likes?.total ?? 0) + 50 - index);
        const mentionCountSpike = Math.max(1.5, (item.likes?.total ?? 0) / 10 || 1.5);

        return tickers.map((ticker) =>
          this.buildRawDocument({
            sourceName: "Stocktwits",
            sourceKind: "social",
            title: `Stocktwits trending mention: ${ticker}`,
            url: `${this.apiUrl}#message-${item.id ?? index + 1}-${ticker}`,
            content: `${body}\nSentiment: ${sentiment}\nCreated: ${item.created_at ?? "unknown"}\nUser: ${item.user?.username ?? "unknown"}`,
            rawPayload: JSON.stringify(item),
            rawPayloadFormat: "json",
            tickersHint: [ticker],
            publishedAt: item.created_at ?? new Date().toISOString(),
            metadata: {
              ticker,
              sentiment,
              mentionCountSpike,
              trendingScore,
              messageId: item.id ?? null,
              createdAt: item.created_at ?? null,
              likes: item.likes?.total ?? 0,
              replies: item.conversation?.replies ?? 0,
              username: item.user?.username ?? null,
              sourceType: "social_momentum"
            }
          })
        );
      })
      .filter((document) => document.tickersHint.length > 0)
      .filter((document, index, items) => {
        const dedupeKey = `${document.metadata.messageId ?? "unknown"}:${document.tickersHint[0] ?? "unknown"}`;
        return (
          items.findIndex((candidate) => {
            const candidateKey = `${candidate.metadata.messageId ?? "unknown"}:${candidate.tickersHint[0] ?? "unknown"}`;
            return candidateKey === dedupeKey;
          }) === index
        );
      });
  }
}
