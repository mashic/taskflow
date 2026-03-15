import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { TasksModule } from '../tasks/tasks.module';
import { UsersModule } from '../users/users.module';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './comments.repository';
import { CommentsService } from './comments.service';
import { InAppNotificationStrategy } from './strategies/in-app-notification.strategy';
import { NOTIFICATION_STRATEGIES } from './strategies/notification.strategy';
import { WebSocketNotificationStrategy } from './strategies/websocket-notification.strategy';

/**
 * Comments Module
 *
 * Demonstrates Strategy Pattern for notifications:
 * - NOTIFICATION_STRATEGIES token provides array of all notification strategies
 * - CommentsService iterates through strategies when @mentions are detected
 * - Adding new channels (email, push) only requires:
 *   1. Creating a new strategy implementing NotificationStrategy
 *   2. Adding it to the useFactory array below
 */
@Module({
  imports: [EventsModule, TasksModule, UsersModule],
  controllers: [CommentsController],
  providers: [
    CommentsService,
    CommentsRepository,
    InAppNotificationStrategy,
    WebSocketNotificationStrategy,
    {
      provide: NOTIFICATION_STRATEGIES,
      useFactory: (
        inAppStrategy: InAppNotificationStrategy,
        wsStrategy: WebSocketNotificationStrategy,
      ) => [inAppStrategy, wsStrategy],
      inject: [InAppNotificationStrategy, WebSocketNotificationStrategy],
    },
  ],
  exports: [CommentsService],
})
export class CommentsModule {}
