export type ScheduledJob = {
  jobId: "pre_market_ingestion" | "intraday_ingestion" | "closing_summary_ingestion";
  cron: string;
  description: string;
};

export const ingestionSchedule: ScheduledJob[] = [
  {
    jobId: "pre_market_ingestion",
    cron: "30 7 * * 1-5",
    description: "Pre-market ingestion run at 7:30 AM IST on trading weekdays"
  },
  {
    jobId: "intraday_ingestion",
    cron: "*/15 9-15 * * 1-5",
    description: "Intraday ingestion run every 15 minutes during market hours"
  },
  {
    jobId: "closing_summary_ingestion",
    cron: "0 16 * * 1-5",
    description: "Closing-summary ingestion run at 4:00 PM IST on trading weekdays"
  }
];
