import { z } from "zod";
import { apiError, apiSuccess } from "@/lib/api-response";
import { logRouteError } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

const alertSettingsSchema = z.object({
  telegramEnabled: z.boolean().optional(),
  telegramChatId: z.string().trim().nullable().optional(),
  globalAlerts: z.boolean().optional()
});

// GET /api/alert-settings?userId=xxx
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return apiError("userId is required", 400);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        telegramEnabled: true,
        telegramChatId: true,
        globalAlerts: true
      }
    });

    if (!user) return apiError("User not found", 404);

    return apiSuccess({ settings: user }, 200);
  } catch (error) {
    logRouteError("GET /api/alert-settings", error);
    return apiError("Failed to fetch alert settings", 500);
  }
}

// PATCH /api/alert-settings?userId=xxx
export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) return apiError("userId is required", 400);

    const body = await request.json();
    const parsed = alertSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return apiError("Invalid request body", 400, parsed.error.flatten());
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.telegramEnabled !== undefined && { telegramEnabled: parsed.data.telegramEnabled }),
        ...(parsed.data.telegramChatId !== undefined && { telegramChatId: parsed.data.telegramChatId }),
        ...(parsed.data.globalAlerts !== undefined && { globalAlerts: parsed.data.globalAlerts })
      },
      select: {
        telegramEnabled: true,
        telegramChatId: true,
        globalAlerts: true
      }
    });

    return apiSuccess({ settings: updated }, 200);
  } catch (error) {
    logRouteError("PATCH /api/alert-settings", error);
    return apiError("Failed to update alert settings", 500);
  }
}
