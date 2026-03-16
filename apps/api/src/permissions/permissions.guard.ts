import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from './decorators/require-permission.decorator';
import { PermissionsService } from './permissions.service';
import { PermissionAction } from './strategies/permission.strategy';

/**
 * Board Permission Guard
 * 
 * Enforces role-based permissions on board operations.
 * Uses the @RequirePermission decorator to determine what action is required,
 * then delegates to PermissionsService which uses the Strategy pattern.
 * 
 * The guard extracts boardId from:
 * 1. Route params (:boardId or :id for boards)
 * 2. Request body (boardId field)
 * 3. Entity lookup (for lists, tasks, members)
 */
@Injectable()
export class BoardPermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator
    const requiredPermission = this.reflector.getAllAndOverride<PermissionAction>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no permission required, allow access (backward compatible)
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.userId || request.user?.id;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract boardId from various sources
    const boardId = await this.extractBoardId(request);

    if (!boardId) {
      throw new ForbiddenException('Could not determine board context');
    }

    // Check permission using service (which uses strategy pattern)
    const hasPermission = await this.permissionsService.can(
      userId,
      boardId,
      requiredPermission,
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Insufficient permissions: ${requiredPermission} access required`,
      );
    }

    return true;
  }

  /**
   * Extract boardId from request params, body, or by looking up entity
   */
  private async extractBoardId(request: any): Promise<string | null> {
    const params = request.params || {};
    const body = request.body || {};

    // Direct boardId in params
    if (params.boardId) {
      return params.boardId;
    }

    // For board routes (/boards/:id), the :id IS the boardId
    if (request.path?.includes('/boards/') && params.id) {
      return params.id;
    }

    // boardId in request body
    if (body.boardId) {
      return body.boardId;
    }

    // Need to look up entity to get boardId
    // For list routes
    if (params.listId || (params.id && request.path?.includes('/lists/'))) {
      const listId = params.listId || params.id;
      return this.permissionsService.getBoardIdFromList(listId);
    }

    // For task routes
    if (params.taskId || (params.id && request.path?.includes('/tasks/'))) {
      const taskId = params.taskId || params.id;
      return this.permissionsService.getBoardIdFromTask(taskId);
    }

    // For team member routes
    if (params.id && request.path?.includes('/members/')) {
      return this.permissionsService.getBoardIdFromMember(params.id);
    }

    return null;
  }
}
