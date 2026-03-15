import { Injectable } from '@nestjs/common';
import { PermissionStrategy } from './permission.strategy';

/**
 * Owner Permission Strategy
 * 
 * Owner has full control over the board:
 * - All read/write operations
 * - Manage team members
 * - Delete board
 */
@Injectable()
export class OwnerPermissionStrategy implements PermissionStrategy {
  canRead(): boolean {
    return true;
  }

  canWrite(): boolean {
    return true;
  }

  canManageMembers(): boolean {
    return true;
  }

  canDelete(): boolean {
    return true;
  }
}
