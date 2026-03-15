import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivityController } from './activity.controller';
import { ActivityRepository } from './activity.repository';
import { ActivityService } from './activity.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController],
  providers: [
    ActivityRepository,
    ActivityService,
    // Register as global interceptor using Decorator pattern
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [ActivityService],
})
export class ActivityModule {}
