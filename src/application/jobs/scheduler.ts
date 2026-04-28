import cron from "node-cron";
import { generateReportJob } from "@/application/jobs/generate-report-job";
import { ingestSourcesJob } from "@/application/jobs/ingest-sources-job";
import { ingestMarketDataJob } from "@/application/jobs/ingest-market-data-job";
import { runSignalEngineJob } from "@/application/jobs/run-signal-engine-job";
import { ingestSectorMomentumJob } from "@/application/jobs/ingest-sector-momentum-job";
import { ingestInstitutionalFlowJob } from "@/application/jobs/ingest-institutional-flow-job";
import { ingestDealsJob } from "@/application/jobs/ingest-deals-job";
import { sendTelegramReport } from "@/application/use-cases/send-telegram-report";

const timezone = "Asia/Kolkata";

function safeRun(name: string, job: () => Promise<unknown>) {
  return async () => {
    try {
      await job();
      console.info(`[scheduler] completed ${name}`);
    } catch (error) {
      console.error(`[scheduler] failed ${name}`, error);
    }
  };
}

export function startScheduler() {
  const tasks = [
    cron.schedule("30 7 * * 1-5", safeRun("pre-market-ingestion", ingestSourcesJob), {
      timezone
    }),
    cron.schedule(
      "0 8 * * 1-5",
      safeRun("pre-market-signal-engine", () =>
        runSignalEngineJob({ performIngestion: false })
      ),
      { timezone }
    ),
    cron.schedule("15 8 * * 1-5", async () => {
      await safeRun("pre-market-report", generateReportJob)();
      // Wait a moment then send telegram
      setTimeout(() => {
        safeRun("send-telegram-report", sendTelegramReport)();
      }, 5000);
    }, {
      timezone
    }),
    cron.schedule("*/15 9-15 * * 1-5", safeRun("intraday-ingestion", ingestSourcesJob), {
      timezone
    }),
    cron.schedule("*/15 9-15 * * 1-5", async () => {
      console.info("[scheduler] Triggering intraday market data & sector ingestion...");
      await ingestMarketDataJob();
      await ingestSectorMomentumJob();
    }),
    cron.schedule("25 7 * * 1-5", async () => {
      console.info("[scheduler] Triggering pre-market data & sector & flow & deals sync...");
      await ingestMarketDataJob();
      await ingestSectorMomentumJob();
      await ingestInstitutionalFlowJob();
      await ingestDealsJob();
    }),
    cron.schedule("0 19 * * 1-5", safeRun("daily-institutional-flow", ingestInstitutionalFlowJob), {
      timezone
    }),
    cron.schedule("15 19 * * 1-5", safeRun("daily-deals-sync", ingestDealsJob), {
      timezone
    }),
    cron.schedule("0 16 * * 1-5", safeRun("closing-summary", generateReportJob), {
      timezone
    })
  ];

  return {
    stop() {
      tasks.forEach((task) => task.stop());
    }
  };
}
