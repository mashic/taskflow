/**
 * Strategy Pattern Interface for Notifications
 *
 * This interface defines the contract for notification strategies.
 * Each implementation encapsulates a specific notification channel
 * (WebSocket, in-app, email, push notifications, etc.).
 *
 * Benefits:
 * - Open/Closed Principle: Add new channels without modifying existing code
 * - Single Responsibility: Each strategy handles one notification channel
 * - Testability: Each strategy can be tested in isolation
 *
 * Interview talking point:
 * "I used the Strategy pattern for notifications so we can easily add new
 * channels (email, push) without modifying the comment logic. Each strategy
 * implements a common interface, and the service iterates through all
 * registered strategies."
 */

export interface NotificationPayload {
  type: 'mention' | 'reply' | 'assignment';
  title: string;
  body: string;
  taskId: string;
  boardId: string;
  commentId: string;
  senderId: string;
  senderName?: string;
}

export interface NotificationStrategy {
  /**
   * Send a notification to a user
   * @param userId - The ID of the user to notify
   * @param payload - The notification content
   */
  send(userId: string, payload: NotificationPayload): Promise<void>;
}

export const NOTIFICATION_STRATEGIES = 'NOTIFICATION_STRATEGIES';
