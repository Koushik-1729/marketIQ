import { HtmlListingDetailNewsSourceBaseAdapter } from "@/adapters/inbound/sources/html-listing-detail-news-source-base";
import type { RawDocument } from "@/domain/entities/raw-document";
import { stripMarkup } from "@/lib/source-utils";

function extractTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

export abstract class RssWithHtmlFallbackNewsSourceBaseAdapter extends HtmlListingDetailNewsSourceBaseAdapter {
  protected abstract readonly feedUrl: string;

  private async fetchFromRss(): Promise<RawDocument[]> {
    if (!this.feedUrl) {
      return [];
    }

    const xml = await this.fetchText(this.feedUrl, {
      headers: {
        accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8"
      }
    });
    const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];

    return items.slice(0, 10).map((item) =>
      this.buildRawDocument({
        sourceName: this.sourceName,
        sourceKind: "news",
        title: stripMarkup(extractTag(item, "title")),
        url: stripMarkup(extractTag(item, "link")),
        publishedAt: stripMarkup(extractTag(item, "pubDate")) || new Date().toISOString(),
        content:
          stripMarkup(extractTag(item, "description")) ||
          stripMarkup(extractTag(item, "content:encoded")),
        rawPayload: item,
        rawPayloadFormat: "xml",
        metadata: {
          listingUrl: this.listingUrl,
          feedUrl: this.feedUrl,
          extractionMode: "rss"
        }
      })
    );
  }

  async fetchLatest(): Promise<RawDocument[]> {
    try {
      const documents = await this.fetchFromRss();
      if (documents.length > 0) {
        return documents;
      }
    } catch {
      // Fall back to listing-detail scraping when RSS is unavailable or blocked.
    }

    return super.fetchLatest();
  }
}
