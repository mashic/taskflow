import { Injectable, Logger } from '@nestjs/common';
import { NotificationPayload, NotificationStrategy } from './notification.strategy';

/**
 * In-App Notification Strategy
 *
 * Stores notifications for later retrieval (notification bell).
 * For MVP, this just logs the notification. In production, this would
 * persist to a Notification table for the user to view later.
 *
 * Future enhancement: Add Notification model and persist here.
 */
@Injectable()
export class InAppNotificationStrategy implements NotificationStrategy {
  private readonly logger = new Logger(InAppNotificationStrategy.name);

  async send(userId: string, payload: NotificationPayload): Promise<void> {
    this.logger.log(
      `[In-App] Notification for user ${userId}: ${payload.title} - ${payload.body}`,
    );

    // In production, persist to Notification table:
    // await this.prisma.notification.create({
    //   data: {
    //     userId,
    //     type: payload.type,
    //     title: payload.title,
    //     body: payload.body,
    //     readAt: null,
    //     data: payload,
    //   },
    // });
  }
}
