import { HtmlListingDetailNewsSourceBaseAdapter } from "@/adapters/inbound/sources/html-listing-detail-news-source-base";

export class ReutersSourceAdapter extends HtmlListingDetailNewsSourceBaseAdapter {
  protected readonly sourceName = "Reuters Markets";
  protected readonly listingUrl =
    process.env.REUTERS_MARKETS_URL ?? "https://www.reuters.com/markets/";
}
