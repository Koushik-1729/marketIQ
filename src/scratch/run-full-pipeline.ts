import { ingestInstitutionalFlowJob } from "../../src/application/jobs/ingest-institutional-flow-job";
import { ingestDealsJob } from "../../src/application/jobs/ingest-deals-job";
import { runSignalEngineJob } from "../../src/application/jobs/run-signal-engine-job";
import { sendTelegramReport } from "../../src/application/use-cases/send-telegram-report";
import { prisma } from "../../src/lib/prisma";

async function runFullPipeline() {
  console.log("1. Ingesting Real FII/DII Data from NSE...");
  await ingestInstitutionalFlowJob();

  console.log("2. Ingesting Real Block/Bulk Deals (Volume Inferred)...");
  await ingestDealsJob();

  console.log("3. Running Signal Intelligence Engine to calculate final scores...");
  await runSignalEngineJob({ performIngestion: false });

  console.log("4. Sending the final rich report to Telegram...");
  const result = await sendTelegramReport();
  
  if (result.success) {
    console.log(`Pipeline complete! Report sent successfully to ${result.sentCount} users.`);
  } else {
    console.log("Pipeline finished but failed to send report.");
  }
  
  await prisma.$disconnect();
}

runFullPipeline().catch(console.error).finally(() => process.exit(0));
