import { RssWithHtmlFallbackNewsSourceBaseAdapter } from "@/adapters/inbound/sources/rss-with-html-fallback-news-source-base";

export class CnbcTv18SourceAdapter extends RssWithHtmlFallbackNewsSourceBaseAdapter {
  protected readonly sourceName = "CNBC TV18";
  protected readonly feedUrl = process.env.CNBCTV18_MARKETS_RSS_URL ?? "";
  protected readonly listingUrl =
    process.env.CNBCTV18_MARKETS_PAGE ?? "https://www.cnbctv18.com/market/";
}
