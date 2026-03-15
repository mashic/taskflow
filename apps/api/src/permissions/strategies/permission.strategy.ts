/**
 * Permission Strategy Interface
 * 
 * Strategy Pattern (GoF) for RBAC - each role implements different permission rules.
 * Adding a new role = creating a new strategy class without modifying existing code.
 * 
 * Interview talking point: "I used the Strategy pattern for RBAC because each role 
 * has distinct permission rules. The strategy map lets me add new roles (like VIEWER) 
 * without modifying existing code - just add a new strategy class."
 */
export interface PermissionStrategy {
  /**
   * Check if user can read the resource
   */
  canRead(): boolean;

  /**
   * Check if user can write (create, update) the resource
   */
  canWrite(): boolean;

  /**
   * Check if user can manage team members (invite, change roles, remove)
   */
  canManageMembers(): boolean;

  /**
   * Check if user can delete the board
   */
  canDelete(): boolean;
}

/**
 * Permission action types for decorator metadata
 */
export type PermissionAction = 'read' | 'write' | 'manageMembers' | 'delete';
