import "dotenv/config";
import { startScheduler } from "../src/application/jobs/scheduler";

console.info("[jobs] starting scheduler in Asia/Kolkata timezone");
startScheduler();
