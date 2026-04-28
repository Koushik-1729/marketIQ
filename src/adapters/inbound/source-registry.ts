import { BseAnnouncementsSourceAdapter } from "@/adapters/inbound/sources/bse-announcements-source";
import { BusinessStandardSourceAdapter } from "@/adapters/inbound/sources/business-standard-source";
import { CnbcTv18SourceAdapter } from "@/adapters/inbound/sources/cnbc-tv18-source";
import { EconomicTimesSourceAdapter } from "@/adapters/inbound/sources/economic-times-source";
import { MoneycontrolSourceAdapter } from "@/adapters/inbound/sources/moneycontrol-source";
import { NseFilingsSourceAdapter } from "@/adapters/inbound/sources/nse-filings-source";
import { ReutersSourceAdapter } from "@/adapters/inbound/sources/reuters-source";
import { StocktwitsSourceAdapter } from "@/adapters/inbound/sources/stocktwits-source";
import type { RawDocumentSourcePort } from "@/domain/ports/raw-document-source";

export type RegisteredSource = {
  sourceName: string;
  adapter: RawDocumentSourcePort;
};

export function createSourceRegistry(): RegisteredSource[] {
  return [
    { sourceName: "Reuters Markets", adapter: new ReutersSourceAdapter() },
    { sourceName: "Economic Times", adapter: new EconomicTimesSourceAdapter() },
    { sourceName: "Moneycontrol", adapter: new MoneycontrolSourceAdapter() },
    { sourceName: "CNBC TV18", adapter: new CnbcTv18SourceAdapter() },
    { sourceName: "Business Standard", adapter: new BusinessStandardSourceAdapter() },
    { sourceName: "NSE Filing", adapter: new NseFilingsSourceAdapter() },
    { sourceName: "BSE Announcement", adapter: new BseAnnouncementsSourceAdapter() },
    { sourceName: "Stocktwits", adapter: new StocktwitsSourceAdapter() }
  ];
}
