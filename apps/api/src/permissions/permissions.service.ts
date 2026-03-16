import { Injectable } from '@nestjs/common';
import { BoardRole } from '@prisma/client';
import { BoardsRepository } from '../boards/boards.repository';
import { ListsRepository } from '../lists/lists.repository';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsRepository } from '../teams/teams.repository';
import { AdminPermissionStrategy } from './strategies/admin-permission.strategy';
import { MemberPermissionStrategy } from './strategies/member-permission.strategy';
import { OwnerPermissionStrategy } from './strategies/owner-permission.strategy';
import { PermissionAction, PermissionStrategy } from './strategies/permission.strategy';

/**
 * Permissions Service
 * 
 * Uses Strategy pattern to select the appropriate permission strategy
 * based on the user's role in the board. Each role has its own strategy
 * that determines what actions are allowed.
 */
@Injectable()
export class PermissionsService {
  private readonly strategies: Map<BoardRole, PermissionStrategy>;

  constructor(
    private teamsRepository: TeamsRepository,
    private boardsRepository: BoardsRepository,
    private listsRepository: ListsRepository,
    private prisma: PrismaService,
    ownerStrategy: OwnerPermissionStrategy,
    adminStrategy: AdminPermissionStrategy,
    memberStrategy: MemberPermissionStrategy,
  ) {
    // Strategy map - selects permission logic based on role
    this.strategies = new Map<BoardRole, PermissionStrategy>([
      [BoardRole.OWNER, ownerStrategy],
      [BoardRole.ADMIN, adminStrategy],
      [BoardRole.MEMBER, memberStrategy],
    ]);
  }

  /**
   * Get user's role for a board (checks both ownership and team membership)
   */
  async getUserRole(userId: string, boardId: string): Promise<BoardRole | null> {
    // First check if user is the board owner
    const board = await this.boardsRepository.findById(boardId);
    if (board?.ownerId === userId) {
      return BoardRole.OWNER;
    }

    // Check team membership
    const member = await this.teamsRepository.findMember(boardId, userId);
    return member?.role ?? null;
  }

  /**
   * Check if user can perform an action on a board
   */
  async can(userId: string, boardId: string, action: PermissionAction): Promise<boolean> {
    const role = await this.getUserRole(userId, boardId);
    
    if (!role) {
      return false; // User is not owner or member
    }

    const strategy = this.strategies.get(role);
    if (!strategy) {
      return false; // Unknown role
    }

    // Call the appropriate method based on action
    switch (action) {
      case 'read':
        return strategy.canRead();
      case 'write':
        return strategy.canWrite();
      case 'manageMembers':
        return strategy.canManageMembers();
      case 'delete':
        return strategy.canDelete();
      default:
        return false;
    }
  }

  /**
   * Get boardId from a list
   */
  async getBoardIdFromList(listId: string): Promise<string | null> {
    const list = await this.listsRepository.findById(listId);
    return list?.boardId ?? null;
  }

  /**
   * Get boardId from a task
   */
  async getBoardIdFromTask(taskId: string): Promise<string | null> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { boardId: true },
    });
    return task?.boardId ?? null;
  }

  /**
   * Get boardId from a team member
   */
  async getBoardIdFromMember(memberId: string): Promise<string | null> {
    const member = await this.teamsRepository.findById(memberId);
    return member?.boardId ?? null;
  }
}
