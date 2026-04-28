import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return apiError("chatId is required", 400);
    }

    // For MVP: link to the first user or create a default user if none exist.
    // In production, this would be tied to the authenticated session.
    let user = await prisma.user.findFirst();

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: "admin@marketengine.local",
          telegramChatId: chatId,
          telegramEnabled: true
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramEnabled: true
        }
      });
    }

    return apiSuccess({
      message: "Telegram successfully linked",
      user: { id: user.id, telegramEnabled: user.telegramEnabled }
    });
  } catch (error) {
    logRouteError("POST /api/telegram/register", error);
    return apiError("Failed to register Telegram", 500);
  }
}
