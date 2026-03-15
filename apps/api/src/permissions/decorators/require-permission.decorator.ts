import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '../strategies/permission.strategy';

export const PERMISSION_KEY = 'permission';

/**
 * Decorator to mark controller methods with required permission.
 * Used with BoardPermissionGuard to enforce role-based access.
 * 
 * Usage: @RequirePermission('write') on a controller method
 */
export const RequirePermission = (action: PermissionAction) =>
  SetMetadata(PERMISSION_KEY, action);
