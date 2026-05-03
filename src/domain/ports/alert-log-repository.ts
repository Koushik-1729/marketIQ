export interface AlertLogRepository {
  exists(cardId: string, userId: string, channel: string): Promise<boolean>;
  create(input: { cardId: string; userId: string; channel: string }): Promise<void>;
}
