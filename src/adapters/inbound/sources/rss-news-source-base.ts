import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";
import { stripMarkup } from "@/lib/source-utils";
import { BaseHttpSourceAdapter } from "@/adapters/inbound/sources/base-http-source";

function extractTag(block: string, tagName: string) {
  const match = block.match(new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

export abstract class RssNewsSourceBaseAdapter
  extends BaseHttpSourceAdapter
  implements RawDocumentSourcePort
{
  protected abstract readonly sourceName: string;
  protected abstract readonly feedUrl: string;

  async fetchLatest(): Promise<RawDocument[]> {
    if (!this.feedUrl) {
      return [];
    }

    const xml = await this.fetchText(this.feedUrl);
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
        rawPayloadFormat: "xml"
      })
    );
  }
}
