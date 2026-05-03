-- AlterTable
ALTER TABLE "User" ADD COLUMN     "globalAlerts" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "alert_logs" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'telegram',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "alert_logs_userId_idx" ON "alert_logs"("userId");

-- CreateIndex
CREATE INDEX "alert_logs_cardId_idx" ON "alert_logs"("cardId");

-- CreateIndex
CREATE INDEX "alert_logs_sentAt_idx" ON "alert_logs"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "alert_logs_cardId_userId_channel_key" ON "alert_logs"("cardId", "userId", "channel");
