export class TelegramClient {
  private readonly baseUrl: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn("[telegram-client] TELEGRAM_BOT_TOKEN is not set in environment.");
    }
    this.baseUrl = `https://api.telegram.org/bot${token || "MOCK_TOKEN"}`;
  }

  async sendMessage(chatId: string, text: string): Promise<boolean> {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn(`[telegram-client] Mock send to ${chatId}: \n${text}`);
      return true;
    }

    try {
      const response = await fetch(`${this.baseUrl}/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "HTML"
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[telegram-client] Failed to send to ${chatId}: ${response.statusText} - ${errorText}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`[telegram-client] Error sending to ${chatId}:`, error);
      return false;
    }
  }

  async sendBulk(chatIds: string[], text: string): Promise<number> {
    let successCount = 0;
    for (const chatId of chatIds) {
      const ok = await this.sendMessage(chatId, text);
      if (ok) successCount++;
      // Sleep slightly to avoid hitting Telegram's rate limit of 30 msg/sec
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return successCount;
  }
}

export const telegramClient = new TelegramClient();
