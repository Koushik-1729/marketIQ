import { NextResponse } from "next/server";
import { getLatestReport } from "@/application/use-cases/get-latest-report";
import { formatTelegramReport } from "@/domain/services/format-telegram-report";
import { telegramClient } from "@/adapters/outbound/telegram/telegram-client";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return apiError("chatId is required", 400);
    }

    const report = await getLatestReport();
    const formattedText = formatTelegramReport(report);

    const success = await telegramClient.sendMessage(chatId, formattedText);

    if (success) {
      return apiSuccess({ message: "Test report sent successfully" });
    } else {
      return apiError("Failed to send telegram message", 500);
    }
  } catch (error) {
    logRouteError("POST /api/telegram/test-send", error);
    return apiError("Internal server error", 500);
  }
}
