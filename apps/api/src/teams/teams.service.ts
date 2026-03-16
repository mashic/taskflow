import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardRole, TeamMember } from '@prisma/client';
import { TeamsRepository } from './teams.repository';

@Injectable()
export class TeamsService {
  constructor(private teamsRepository: TeamsRepository) {}

  async addMember(boardId: string, userId: string, role: BoardRole): Promise<TeamMember> {
    // Check if user is already a member
    const existingMember = await this.teamsRepository.findMember(boardId, userId);
    if (existingMember) {
      throw new ConflictException('User is already a member of this board');
    }

    return this.teamsRepository.create({ boardId, userId, role });
  }

  async getMembers(boardId: string): Promise<TeamMember[]> {
    return this.teamsRepository.findByBoardId(boardId);
  }

  async getMember(boardId: string, userId: string): Promise<TeamMember | null> {
    return this.teamsRepository.findMember(boardId, userId);
  }

  async isMember(boardId: string, userId: string): Promise<boolean> {
    const member = await this.teamsRepository.findMember(boardId, userId);
    return member !== null;
  }

  async getUserRole(boardId: string, userId: string): Promise<BoardRole | null> {
    const member = await this.teamsRepository.findMember(boardId, userId);
    return member?.role ?? null;
  }

  async updateRole(memberId: string, role: BoardRole, requesterId: string): Promise<TeamMember> {
    const member = await this.teamsRepository.findById(memberId);
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    // Get requester's role to check permissions
    const requesterMember = await this.teamsRepository.findMember(member.boardId, requesterId);
    if (!requesterMember || (requesterMember.role !== BoardRole.OWNER && requesterMember.role !== BoardRole.ADMIN)) {
      throw new ForbiddenException('Only owners and admins can change roles');
    }

    // Cannot change owner's role
    if (member.role === BoardRole.OWNER) {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Only owner can promote to admin
    if (role === BoardRole.ADMIN && requesterMember.role !== BoardRole.OWNER) {
      throw new ForbiddenException('Only owner can promote to admin');
    }

    return this.teamsRepository.updateRole(memberId, role);
  }

  async removeMember(memberId: string, requesterId: string): Promise<void> {
    const member = await this.teamsRepository.findById(memberId);
    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    // Check if requester is owner/admin
    const requesterMember = await this.teamsRepository.findMember(member.boardId, requesterId);
    if (!requesterMember || (requesterMember.role !== BoardRole.OWNER && requesterMember.role !== BoardRole.ADMIN)) {
      throw new ForbiddenException('Only owners and admins can remove members');
    }

    // Cannot remove owner
    if (member.role === BoardRole.OWNER) {
      throw new ForbiddenException('Cannot remove board owner');
    }

    // Admins cannot remove other admins
    if (member.role === BoardRole.ADMIN && requesterMember.role !== BoardRole.OWNER) {
      throw new ForbiddenException('Only owner can remove admins');
    }

    await this.teamsRepository.remove(memberId);
  }

  async getUserBoards(userId: string): Promise<TeamMember[]> {
    return this.teamsRepository.findByUserId(userId);
  }
}
