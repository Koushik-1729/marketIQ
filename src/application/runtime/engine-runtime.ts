import { createSourceRegistry } from "@/adapters/inbound/source-registry";
import { PostgresPriceBarRepository } from "@/adapters/outbound/repositories/postgres-price-bar-repository";
import { PostgresSectorBarRepository } from "@/adapters/outbound/repositories/postgres-sector-bar-repository";
import { PostgresInstitutionalFlowRepository } from "@/adapters/outbound/repositories/postgres-institutional-flow-repository";
import { PostgresDealEventRepository } from "@/adapters/outbound/repositories/postgres-deal-event-repository";
import { PostgresFeedbackRepository } from "@/adapters/outbound/repositories/postgres-feedback-repository";
import { PostgresEarningsEventRepository } from "@/adapters/outbound/repositories/postgres-earnings-event-repository";
import { PostgresJobRunRepository } from "@/adapters/outbound/repositories/postgres-job-run-repository";
import { PostgresMarketContextRepository } from "@/adapters/outbound/repositories/postgres-market-context-repository";
import { PostgresPriceValidationRepository } from "@/adapters/outbound/repositories/postgres-price-validation-repository";
import { PostgresRawDocumentRepository } from "@/adapters/outbound/repositories/postgres-raw-document-repository";
import { PostgresSignalRepository } from "@/adapters/outbound/repositories/postgres-signal-repository";
import { PostgresWatchlistRepository } from "@/adapters/outbound/repositories/postgres-watchlist-repository";

export const engineRuntime = {
  sourceRegistry: createSourceRegistry(),
  rawDocumentRepository: new PostgresRawDocumentRepository(),
  marketContextRepository: new PostgresMarketContextRepository(),
  priceValidationRepository: new PostgresPriceValidationRepository(),
  watchlistRepository: new PostgresWatchlistRepository(),
  feedbackRepository: new PostgresFeedbackRepository(),
  earningsEventRepository: new PostgresEarningsEventRepository(),
  signalRepository: new PostgresSignalRepository(),
  jobRunRepository: new PostgresJobRunRepository(),
  priceBarRepository: new PostgresPriceBarRepository(),
  sectorBarRepository: new PostgresSectorBarRepository(),
  institutionalFlowRepository: new PostgresInstitutionalFlowRepository(),
  dealEventRepository: new PostgresDealEventRepository()
};
