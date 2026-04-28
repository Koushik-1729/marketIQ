import { RssWithHtmlFallbackNewsSourceBaseAdapter } from "@/adapters/inbound/sources/rss-with-html-fallback-news-source-base";

export class BusinessStandardSourceAdapter extends RssWithHtmlFallbackNewsSourceBaseAdapter {
  protected readonly sourceName = "Business Standard";
  protected readonly feedUrl = process.env.BUSINESS_STANDARD_MARKETS_RSS_URL ?? "";
  protected readonly listingUrl =
    process.env.BUSINESS_STANDARD_MARKETS_PAGE ??
    "https://www.business-standard.com/markets";
}
