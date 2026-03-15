import { Injectable, Logger } from '@nestjs/common';
import { EventsGateway } from '../../events/events.gateway';
import { NotificationPayload, NotificationStrategy } from './notification.strategy';

/**
 * WebSocket Notification Strategy
 *
 * Sends real-time notifications to users via WebSocket connection.
 * Users will receive instant notifications when mentioned in comments.
 */
@Injectable()
export class WebSocketNotificationStrategy implements NotificationStrategy {
  private readonly logger = new Logger(WebSocketNotificationStrategy.name);

  constructor(private eventsGateway: EventsGateway) {}

  async send(userId: string, payload: NotificationPayload): Promise<void> {
    this.logger.log(`Sending WebSocket notification to user ${userId}: ${payload.title}`);

    // Broadcast to the board room so the user receives it if they're viewing
    this.eventsGateway.broadcastNotification(payload.boardId, {
      type: 'notification',
      userId,
      payload,
    });
  }
}
