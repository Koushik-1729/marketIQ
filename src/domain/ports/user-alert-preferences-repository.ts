export type AlertableUser = {
  id: string;
  telegramChatId: string;
  telegramEnabled: boolean;
  globalAlerts: boolean;
};

export interface UserAlertPreferencesRepository {
  findTelegramEnabledUsers(): Promise<AlertableUser[]>;
  findWatchlistTickers(userId: string): Promise<string[]>;
}
