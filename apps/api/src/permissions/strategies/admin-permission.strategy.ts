import { Injectable } from '@nestjs/common';
import { PermissionStrategy } from './permission.strategy';

/**
 * Admin Permission Strategy
 * 
 * Admin has most permissions except deleting the board:
 * - All read/write operations
 * - Manage team members (invite, change roles, remove)
 * - Cannot delete the board (only owner can)
 */
@Injectable()
export class AdminPermissionStrategy implements PermissionStrategy {
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
    return false; // Only owner can delete board
  }
}
