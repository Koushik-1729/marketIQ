import { RssWithHtmlFallbackNewsSourceBaseAdapter } from "@/adapters/inbound/sources/rss-with-html-fallback-news-source-base";

export class EconomicTimesSourceAdapter extends RssWithHtmlFallbackNewsSourceBaseAdapter {
  protected readonly sourceName = "Economic Times";
  protected readonly feedUrl = process.env.ECONOMIC_TIMES_MARKETS_RSS_URL ?? "";
  protected readonly listingUrl =
    process.env.ECONOMIC_TIMES_MARKETS_PAGE ??
    "https://economictimes.indiatimes.com/markets/stocks/news";
}
