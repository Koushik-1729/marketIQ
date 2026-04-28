import { BaseHttpSourceAdapter } from "@/adapters/inbound/sources/base-http-source";
import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";
import { stripMarkup } from "@/lib/source-utils";

type ListingItem = {
  title: string;
  url: string;
};

function absoluteUrl(baseUrl: string, href: string) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function extractAnchorItems(html: string, baseUrl: string) {
  const matches = Array.from(
    html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)
  );

  return matches
    .map<ListingItem | null>((match) => {
      const href = match[1]?.trim();
      const title = stripMarkup(match[2] ?? "");

      if (!href || title.length < 24) {
        return null;
      }

      return {
        title,
        url: absoluteUrl(baseUrl, href)
      };
    })
    .filter((item): item is ListingItem => item !== null);
}

function dedupeItems(items: ListingItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) {
      return false;
    }
    seen.add(item.url);
    return true;
  });
}

export abstract class HtmlListingDetailNewsSourceBaseAdapter
  extends BaseHttpSourceAdapter
  implements RawDocumentSourcePort
{
  protected abstract readonly sourceName: string;
  protected abstract readonly listingUrl: string;
  protected readonly maxItems = 8;

  protected isRelevantListingItem(item: ListingItem) {
    return /(market|stock|share|result|earnings|ipo|dividend|stake|deal|rating|policy|sebi|rbi)/i.test(
      item.title
    );
  }

  protected extractContentFromDetailPage(html: string) {
    const articleMatch =
      html.match(/<article[\s\S]*?<\/article>/i) ??
      html.match(/<main[\s\S]*?<\/main>/i) ??
      html.match(/<body[\s\S]*?<\/body>/i);

    return stripMarkup(articleMatch?.[0] ?? html).slice(0, 10000);
  }

  protected extractPublishedAt(html: string) {
    const metaMatch =
      html.match(/property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i) ??
      html.match(/name=["']pubdate["'][^>]*content=["']([^"']+)["']/i) ??
      html.match(/datetime=["']([^"']+)["']/i);

    return metaMatch?.[1] ?? new Date().toISOString();
  }

  async fetchLatest(): Promise<RawDocument[]> {
    if (!this.listingUrl) {
      return [];
    }

    const listingHtml = await this.fetchText(this.listingUrl);
    const listingItems = dedupeItems(
      extractAnchorItems(listingHtml, this.listingUrl).filter((item) =>
        this.isRelevantListingItem(item)
      )
    ).slice(0, this.maxItems);

    const documents = await Promise.all(
      listingItems.map(async (item) => {
        const detailHtml = await this.fetchText(item.url, {
          headers: {
            referer: this.listingUrl
          }
        });
        const content = this.extractContentFromDetailPage(detailHtml);

        return this.buildRawDocument({
          sourceName: this.sourceName,
          sourceKind: "news",
          title: item.title,
          url: item.url,
          content,
          rawPayload: detailHtml,
          rawPayloadFormat: "html",
          publishedAt: this.extractPublishedAt(detailHtml),
          metadata: {
            listingUrl: this.listingUrl,
            extractionMode: "listing-detail"
          }
        });
      })
    );

    return documents.filter((document) => document.content.length > 120);
  }
}
