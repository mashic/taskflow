import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Invitation, BoardRole } from '@prisma/client';
import { InvitationsRepository } from './invitations.repository';
import { InvitationFactory, InvitationType } from './factories/invitation.factory';
import { TeamsService } from '../teams/teams.service';
import { CreateEmailInvitationDto, CreateLinkInvitationDto } from './dto/create-invitation.dto';

@Injectable()
export class InvitationsService {
  constructor(
    private invitationsRepository: InvitationsRepository,
    private invitationFactory: InvitationFactory,
    private teamsService: TeamsService,
  ) {}

  /**
   * Create an email invitation using the Factory pattern.
   * Email invitations are single-use and expire in 7 days.
   */
  async createEmailInvitation(dto: CreateEmailInvitationDto, inviterId: string): Promise<Invitation> {
    // Use factory to create invitation data
    const invitationData = this.invitationFactory.create(InvitationType.EMAIL, {
      boardId: dto.boardId,
      inviterId,
      role: dto.role,
      email: dto.email,
    });

    return this.invitationsRepository.create(invitationData);
  }

  /**
   * Create a shareable link invitation using the Factory pattern.
   * Link invitations can be used multiple times (up to 10) and expire in 30 days.
   */
  async createLinkInvitation(dto: CreateLinkInvitationDto, inviterId: string): Promise<Invitation> {
    // Use factory to create invitation data
    const invitationData = this.invitationFactory.create(InvitationType.LINK, {
      boardId: dto.boardId,
      inviterId,
      role: dto.role,
    });

    return this.invitationsRepository.create(invitationData);
  }

  /**
   * Accept an invitation and add user to the board team.
   * Validates expiration and usage limits before accepting.
   */
  async acceptInvitation(token: string, userId: string): Promise<{ boardId: string }> {
    const invitation = await this.invitationsRepository.findByToken(token);
    
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Validate invitation
    this.validateInvitation(invitation);

    // Check if user is already a member
    const isMember = await this.teamsService.isMember(invitation.boardId, userId);
    if (isMember) {
      throw new BadRequestException('You are already a member of this board');
    }

    // Add user to team
    await this.teamsService.addMember(invitation.boardId, userId, invitation.role);

    // Increment usage count
    await this.invitationsRepository.incrementUsedCount(invitation.id);

    return { boardId: invitation.boardId };
  }

  /**
   * Get all invitations for a board.
   */
  async getByBoard(boardId: string): Promise<Invitation[]> {
    return this.invitationsRepository.findByBoardId(boardId);
  }

  /**
   * Get invitation details by token (for preview before accepting).
   */
  async getByToken(token: string): Promise<Invitation> {
    const invitation = await this.invitationsRepository.findByToken(token);
    
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    this.validateInvitation(invitation);
    return invitation;
  }

  /**
   * Revoke an invitation. Only board owner or the inviter can revoke.
   */
  async revoke(id: string, userId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findById(id);
    
    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if user is owner or inviter
    const userRole = await this.teamsService.getUserRole(invitation.boardId, userId);
    const isOwner = userRole === BoardRole.OWNER;
    const isInviter = invitation.inviterId === userId;

    if (!isOwner && !isInviter) {
      throw new ForbiddenException('Only board owners or the inviter can revoke invitations');
    }

    await this.invitationsRepository.delete(id);
  }

  /**
   * Validates that an invitation is still valid.
   */
  private validateInvitation(invitation: Invitation): void {
    // Check expiration
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Invitation has expired');
    }

    // Check usage limit
    if (invitation.usedCount >= invitation.maxUses) {
      throw new BadRequestException('Invitation has reached maximum uses');
    }
  }
}
