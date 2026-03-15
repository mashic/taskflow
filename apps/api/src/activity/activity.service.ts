import { Injectable } from '@nestjs/common';
import { Activity } from '@prisma/client';
import { ActivityRepository, CreateActivityData } from './activity.repository';

@Injectable()
export class ActivityService {
  constructor(private readonly activityRepository: ActivityRepository) {}

  /**
   * Log a new activity. Called by AuditLogInterceptor after
   * successful controller method execution.
   */
  async log(data: CreateActivityData): Promise<Activity> {
    return this.activityRepository.create(data);
  }

  /**
   * Get recent activities for a board.
   */
  async getByBoard(boardId: string, limit = 50) {
    return this.activityRepository.findByBoardId(boardId, limit);
  }

  /**
   * Get activity history for a specific entity.
   */
  async getByEntity(entityType: string, entityId: string) {
    return this.activityRepository.findByEntityId(entityType, entityId);
  }
}
