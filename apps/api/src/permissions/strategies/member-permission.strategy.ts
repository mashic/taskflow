import { Injectable } from '@nestjs/common';
import { PermissionStrategy } from './permission.strategy';

/**
 * Member Permission Strategy
 * 
 * Member has limited permissions:
 * - Read all content
 * - Write (create/update tasks, comments, etc.)
 * - Cannot manage team members
 * - Cannot delete the board
 */
@Injectable()
export class MemberPermissionStrategy implements PermissionStrategy {
  canRead(): boolean {
    return true;
  }

  canWrite(): boolean {
    return true;
  }

  canManageMembers(): boolean {
    return false; // Members cannot manage team
  }

  canDelete(): boolean {
    return false; // Only owner can delete board
  }
}
