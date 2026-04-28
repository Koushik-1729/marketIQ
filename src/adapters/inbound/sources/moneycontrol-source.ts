import { RssWithHtmlFallbackNewsSourceBaseAdapter } from "@/adapters/inbound/sources/rss-with-html-fallback-news-source-base";

export class MoneycontrolSourceAdapter extends RssWithHtmlFallbackNewsSourceBaseAdapter {
  protected readonly sourceName = "Moneycontrol";
  protected readonly feedUrl = process.env.MONEYCONTROL_MARKETS_RSS_URL ?? "";
  protected readonly listingUrl =
    process.env.MONEYCONTROL_MARKETS_PAGE ??
    "https://www.moneycontrol.com/news/business/markets/";
}
