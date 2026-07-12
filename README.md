# AI Market Signal Intelligence Engine

Frontend plus core-system scaffold for an event-driven market intelligence engine built with a hexagonal-friendly structure.

## Current scope

- Next.js app-router frontend
- Domain, application, adapter, and UI separation
- Core signal-engine pipeline from raw documents to ranked signals
- Source registry and ingestion orchestration for structured source adapters
- Overview, Signals, Watchlists, Reports, and Admin pages
- In-memory source, market context, price validation, and watchlist adapters

## Run locally

```bash
npm install
npm run dev
```

## Ingestion configuration

The source registry is live, but several sources are configured through environment variables so adapters can be pointed at approved feeds or APIs without changing core logic.

```bash
NSE_FILINGS_URL=
BSE_ANNOUNCEMENTS_URL=
STOCKTWITS_API_URL=
STOCKTWITS_ACCESS_TOKEN=
ECONOMIC_TIMES_MARKETS_RSS_URL=
MONEYCONTROL_MARKETS_RSS_URL=
CNBCTV18_MARKETS_RSS_URL=
BUSINESS_STANDARD_MARKETS_RSS_URL=
ECONOMIC_TIMES_MARKETS_PAGE=
MONEYCONTROL_MARKETS_PAGE=
CNBCTV18_MARKETS_PAGE=
BUSINESS_STANDARD_MARKETS_PAGE=
```

News-source precedence:

- RSS/API first
- page scraping fallback second

## Supabase Prisma Setup

If you want to use Supabase as the PostgreSQL backend, use:

- `DATABASE_URL` for runtime queries through the pooler
- `DIRECT_URL` for Prisma migrations

Example:

```bash
cp .env.local.example .env.local
```

Important:

- Keep the pooler URL on port `6543` for `DATABASE_URL`
- Use the direct database host `db.*********.supabase.co:5432` for `DIRECT_URL`
- Do not use the pooler host for `DIRECT_URL`, because Prisma migrations should use the direct connection

Schedulers are defined in:

- `src/adapters/inbound/schedulers/ingestion-schedule.ts`

Main ingestion orchestration lives in:

- `src/application/use-cases/ingest-raw-documents.ts`

## Database Architecture

The persistence layer now uses `PostgreSQL + Prisma` and is designed to keep raw source evidence before any intelligence processing happens.

Core storage flow:

1. `RawDocument`
   Stores original source payload, raw text, source URL, URL hash, published time, and fetched time.
2. `NormalizedDocument`
   Stores cleaned text produced from raw documents.
3. `ExtractedEvent`
   Stores extracted tickers, keywords, and event hints.
4. `EnrichedEvent`
   Stores event type, sentiment, confidence, event weight, and source credibility.
5. `EventCluster`
   Stores grouped event windows per ticker.
6. `EngineSignal`
   Stores final scored signals.
7. `SignalExplanation`
   Stores user-facing reasons and summary attached to signals.
8. `FeedbackOutcome`
   Stores post-signal evaluation data for later calibration.
9. `IngestionRun` and `SourceHealth`
   Store ingestion observability and source reliability data.
10. `Watchlist`, `WatchlistTicker`, `User`
    Store user preferences for personalization.

Prisma usage rules:

- `PrismaClient` is used only in outbound repository adapters under `src/adapters/outbound/repositories`.
- The domain layer does not import Prisma.
- Schema is versioned in `prisma/schema.prisma`.
- Initial migration is version-controlled in `prisma/migrations/20260426000000_init/migration.sql`.
- Seed data lives in `prisma/seed.ts`.

Typical local commands:

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
```

## Local Database Setup

For Supabase-backed local development:

1. Copy `.env.local.example` to `.env.local`
2. Put the same database variables into `.env` as well, because Prisma CLI reads `.env`
3. Keep:
   `DATABASE_URL` for runtime queries
   `DIRECT_URL` for Prisma migration operations

Example commands:

```bash
npm run prisma:deploy
npm run prisma:seed
npm run dev -- --hostname 127.0.0.1 --port 3000
```

## API Test Commands

Manual checks:

```bash
curl http://127.0.0.1:3000/api/watchlists
curl -X POST http://127.0.0.1:3000/api/signals/run
curl "http://127.0.0.1:3000/api/signals?limit=10&sort=score_desc"
curl http://127.0.0.1:3000/api/signals/<signal-id>
curl http://127.0.0.1:3000/api/reports/latest
curl -X POST http://127.0.0.1:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{"signalId":"<signal-id>","outcome":"DOWN","priceChange":-2.4,"horizon":"1d"}'
```

Smoke test:

```bash
npm run api:smoke
```

## Scheduler And Jobs

Background jobs now live under:

- `src/application/jobs/ingest-sources-job.ts`
- `src/application/jobs/run-signal-engine-job.ts`
- `src/application/jobs/generate-report-job.ts`

Scheduler runner:

- `src/application/jobs/scheduler.ts`

Commands:

```bash
npm run jobs:start
npm run jobs:once
```

Scheduled jobs run in `Asia/Kolkata`:

- Pre-market ingestion: `7:30 AM IST`
- Pre-market signal engine: `8:00 AM IST`
- Report generation: `8:15 AM IST`
- Intraday ingestion: every `15 minutes`
- Closing summary: `4:00 PM IST`

Job flow:

1. source ingestion
2. signal engine run
3. report generation

Long-running execution has been moved out of synchronous API handling. `POST /api/signals/run` now starts a background run and returns immediately with a `202` response.

## Suggested next steps

1. Add typed API contracts for signals, reports, and watchlists.
2. Move the raw document repository to Postgres/object storage.
3. Connect the frontend to backend use cases via HTTP adapters.
4. Add authentication and role-aware admin pages.
# marketIQ
