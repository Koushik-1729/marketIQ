import { BaseHttpSourceAdapter } from "@/adapters/inbound/sources/base-http-source";
import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";
import { stripMarkup } from "@/lib/source-utils";

function parseBseAnnouncementBlocks(html: string) {
  const lines = stripMarkup(html)
    .split(/(?=[A-Z0-9&.-]{2,15}\s)/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .filter((line) => /\d{2}\/\d{2}\/\d{4}|\d{2}-[A-Za-z]{3}-\d{2,4}/.test(line) || line.length > 40)
    .map((line) => {
      const tokens = line.split(/\s+/);
      const ticker = tokens[0];
      const category = detectBseCategory(line);

      return {
        ticker,
        text: line,
        category,
        announcementType: category,
        eventTimestamp: extractDate(line)
      };
    })
    .slice(0, 12);
}

function detectBseCategory(text: string) {
  const normalized = text.toLowerCase();

  if (normalized.includes("result")) return "results";
  if (normalized.includes("dividend")) return "dividend";
  if (normalized.includes("acquisition") || normalized.includes("merger")) return "acquisition";
  if (normalized.includes("allotment")) return "allotment";
  if (normalized.includes("board")) return "board";
  return "other";
}

function extractDate(text: string) {
  const match = text.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/);
  return match?.[0];
}

function isEarningsAnnouncement(text: string) {
  return /(results|financial results|quarterly results|earnings|\bq[1-4]\b)/i.test(text);
}

export class BseAnnouncementsSourceAdapter
  extends BaseHttpSourceAdapter
  implements RawDocumentSourcePort
{
  private readonly announcementsUrl =
    process.env.BSE_ANNOUNCEMENTS_URL ?? "https://www.bseindia.com/corporates.html";

  async fetchLatest(): Promise<RawDocument[]> {
    const html = await this.fetchText(this.announcementsUrl, {
      headers: {
        referer: "https://www.bseindia.com/"
      }
    });
    const blocks = parseBseAnnouncementBlocks(html);

    if (blocks.length === 0) {
      return [
        this.buildRawDocument({
          sourceName: "BSE Announcement",
          sourceKind: "filing",
          title: "BSE corporate announcements snapshot",
          url: this.announcementsUrl,
          content: stripMarkup(html).slice(0, 4000),
          rawPayload: html,
          rawPayloadFormat: "html"
        })
      ];
    }

    return blocks.map((block, index) =>
      this.buildRawDocument({
        sourceName: "BSE Announcement",
        sourceKind: "filing",
        title: `${block.ticker} ${block.category}`,
        url: `${this.announcementsUrl}#item-${index + 1}`,
        content: block.text,
        rawPayload: html,
        rawPayloadFormat: "html",
        tickersHint: [block.ticker],
        metadata: {
          ticker: block.ticker,
          announcementType: block.announcementType,
          category: block.category,
          eventTimestamp: block.eventTimestamp,
          companyName: block.ticker,
          earningsCandidate: isEarningsAnnouncement(block.text)
        }
      })
    );
  }
}
