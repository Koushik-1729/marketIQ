import { prisma } from "../../src/lib/prisma";
import { ingestSourcesJob } from "../../src/application/jobs/ingest-sources-job";
import { runSignalEngineJob } from "../../src/application/jobs/run-signal-engine-job";
import { sendTelegramReport } from "../../src/application/use-cases/send-telegram-report";

async function run() {
  try {
    console.log("1. Ingesting LIVE News & Sources...");
    const { result: ingestionSummary } = await ingestSourcesJob();
    console.log(`Ingested ${ingestionSummary.persistedDocuments} new documents from ${ingestionSummary.sourceStatuses.length} sources.`);

    console.log("\n2. Running Signal Intelligence Engine to evaluate the new news...");
    // performIngestion is false here since we just ran ingestSourcesJob
    await runSignalEngineJob({ performIngestion: false });

    console.log("\n3. Generating and sending Pre-Market Report to your Telegram...");
    const result = await sendTelegramReport();
    
    if (result.success) {
      console.log(`Success! Sent report to ${result.sentCount} users.`);
    } else {
      console.log("Failed to send report.");
    }
  } catch (error) {
    console.error("Pipeline failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch(console.error).finally(() => process.exit(0));
