-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "JobRun" (
  "id" TEXT NOT NULL,
  "jobName" TEXT NOT NULL,
  "status" "JobRunStatus" NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "error" TEXT,
  "metadata" JSONB,
  CONSTRAINT "JobRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRun_jobName_idx" ON "JobRun"("jobName");
CREATE INDEX "JobRun_status_idx" ON "JobRun"("status");
CREATE INDEX "JobRun_startedAt_idx" ON "JobRun"("startedAt");
