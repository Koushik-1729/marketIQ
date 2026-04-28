import { BaseHttpSourceAdapter } from "@/adapters/inbound/sources/base-http-source";
import type { RawDocument } from "@/domain/entities/raw-document";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";
import { stripMarkup } from "@/lib/source-utils";

function parseNseRows(html: string) {
  const rows =
    html.match(/<tr[\s\S]*?<td[\s\S]*?<\/td>[\s\S]*?<td[\s\S]*?<\/td>[\s\S]*?<td[\s\S]*?<\/td>[\s\S]*?<\/tr>/gi) ??
    [];

  return rows
    .map((row) => {
      const cells =
        row.match(/<td[\s\S]*?>([\s\S]*?)<\/td>/gi)?.map((cell) => stripMarkup(cell)) ?? [];

      if (cells.length < 3) {
        return null;
      }

      return {
        ticker: cells[0],
        subject: cells[1],
        publishedAt: cells[2],
        category: detectNseCategory(cells[1]),
        announcementType: detectAnnouncementType(cells[1])
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(0, 20);
}

function detectAnnouncementType(subject: string) {
  const text = subject.toLowerCase();

  if (text.includes("board meeting")) return "board_meeting";
  if (text.includes("outcome")) return "board_outcome";
  if (text.includes("dividend")) return "dividend";
  if (text.includes("results") || text.includes("financial result")) return "results";
  if (text.includes("acquisition") || text.includes("merger")) return "m&a";
  if (text.includes("shareholding")) return "shareholding";
  return "general_announcement";
}

function detectNseCategory(subject: string) {
  const text = subject.toLowerCase();

  if (text.includes("result")) return "results";
  if (text.includes("dividend")) return "dividend";
  if (text.includes("acquisition") || text.includes("merger")) return "acquisition";
  if (text.includes("buyback")) return "buyback";
  if (text.includes("promoter")) return "promoter_activity";
  return "other";
}

function isEarningsSubject(subject: string) {
  return /(results|financial results|quarterly results|earnings|\bq[1-4]\b)/i.test(subject);
}

export class NseFilingsSourceAdapter
  extends BaseHttpSourceAdapter
  implements RawDocumentSourcePort
{
  private readonly listingUrl =
    process.env.NSE_FILINGS_URL ??
    "https://www.nseindia.com/companies-listing/corporate-filings-application?id=allAnnouncements";

  async fetchLatest(): Promise<RawDocument[]> {
    const html = await this.fetchText(this.listingUrl, {
      headers: {
        referer: "https://www.nseindia.com/",
        origin: "https://www.nseindia.com"
      }
    });
    const rows = parseNseRows(html);

    if (rows.length === 0) {
      return [
        this.buildRawDocument({
          sourceName: "NSE Filing",
          sourceKind: "filing",
          title: "NSE corporate filings snapshot",
          url: this.listingUrl,
          content: stripMarkup(html).slice(0, 4000),
          rawPayload: html,
          rawPayloadFormat: "html"
        })
      ];
    }

    return rows.map((row, index) =>
      this.buildRawDocument({
        sourceName: "NSE Filing",
        sourceKind: "filing",
        title: `${row.ticker} ${row.subject}`,
        url: `${this.listingUrl}#row-${index}`,
        publishedAt: row.publishedAt,
        content: `${row.ticker} ${row.subject}`,
        rawPayload: html,
        rawPayloadFormat: "html",
        tickersHint: [row.ticker]
        ,
        metadata: {
          ticker: row.ticker,
          announcementType: row.announcementType,
          category: row.category,
          eventTimestamp: row.publishedAt,
          companyName: row.ticker,
          earningsCandidate: isEarningsSubject(row.subject)
        }
      })
    );
  }
}
