import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Observable, tap } from 'rxjs';
import { ActivityService } from '../activity.service';
import { AUDIT_LOG_KEY, AuditLogOptions } from '../decorators/audit-log.decorator';

/**
 * Decorator Pattern Implementation: Intercepts controller method calls
 * and logs activities to the database after successful execution.
 * 
 * The interceptor reads @AuditLog metadata and wraps the method execution,
 * adding audit logging without modifying the original method logic.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly activityService: ActivityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    // If no @AuditLog decorator, pass through
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub || request.user?.id;

    return next.handle().pipe(
      tap(async (result) => {
        if (!result || !userId) return;

        // Extract boardId from result, params, or body
        const boardId =
          result.boardId ||
          request.params?.boardId ||
          request.body?.boardId;

        // Extract entityId from result or params
        const entityId = result.id || request.params?.id;

        if (!boardId || !entityId) return;

        try {
          await this.activityService.log({
            type: options.action,
            entityType: options.entity,
            entityId,
            boardId,
            userId,
            data: this.sanitizeData(result),
          });
        } catch (error) {
          // Log error but don't fail the request
          console.error('Failed to log activity:', error);
        }
      }),
    );
  }

  /**
   * Sanitize result data for storage, removing sensitive/circular refs
   */
  private sanitizeData(result: unknown): Prisma.InputJsonValue {
    if (!result || typeof result !== 'object') {
      return {};
    }

    const { password, refreshToken, ...safe } = result as Record<string, unknown>;
    return safe as Prisma.InputJsonValue;
  }
}
