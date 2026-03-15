import { Injectable } from '@nestjs/common';
import { BoardRole, Prisma } from '@prisma/client';
import * as crypto from 'crypto';

/**
 * Invitation type enum for Factory pattern
 * EMAIL: Single-use invitation sent to specific email
 * LINK: Multi-use shareable link invitation
 */
export enum InvitationType {
  EMAIL = 'EMAIL',
  LINK = 'LINK',
}

/**
 * Data required to create an invitation
 */
export interface InvitationData {
  boardId: string;
  inviterId: string;
  role: BoardRole;
  email?: string;
}

/**
 * Factory pattern implementation for creating different types of invitations.
 *
 * Interview talking point: "I used the Factory pattern for invitations because
 * email and link invitations have different creation logic - different expiration
 * times, usage limits, and token lengths. The factory encapsulates this logic
 * and makes it easy to add new invitation types without modifying existing code."
 *
 * Design decisions:
 * - EMAIL invitations: 7-day expiry, single use, 32-char token, sent to specific email
 * - LINK invitations: 30-day expiry, 10 uses max, 16-char URL-safe token
 */
@Injectable()
export class InvitationFactory {
  /**
   * Creates invitation data based on type.
   * Factory method that encapsulates the creation logic for different invitation types.
   */
  create(type: InvitationType, data: InvitationData): Prisma.InvitationCreateInput {
    switch (type) {
      case InvitationType.EMAIL:
        return this.createEmailInvitation(data);
      case InvitationType.LINK:
        return this.createLinkInvitation(data);
      default:
        throw new Error(`Unknown invitation type: ${type}`);
    }
  }

  /**
   * Creates an email invitation:
   * - 7-day expiration (shorter because sent directly)
   * - Single use only
   * - 32-character secure token
   */
  private createEmailInvitation(data: InvitationData): Prisma.InvitationCreateInput {
    if (!data.email) {
      throw new Error('Email is required for email invitations');
    }

    return {
      type: InvitationType.EMAIL,
      email: data.email,
      role: data.role,
      token: this.generateToken(32),
      expiresAt: this.getExpirationDate(7), // 7 days
      maxUses: 1,
      board: { connect: { id: data.boardId } },
      inviter: { connect: { id: data.inviterId } },
    };
  }

  /**
   * Creates a link invitation:
   * - 30-day expiration (longer for sharing)
   * - Multiple uses (up to 10)
   * - 16-character URL-safe token
   */
  private createLinkInvitation(data: InvitationData): Prisma.InvitationCreateInput {
    return {
      type: InvitationType.LINK,
      role: data.role,
      token: this.generateToken(16),
      expiresAt: this.getExpirationDate(30), // 30 days
      maxUses: 10,
      board: { connect: { id: data.boardId } },
      inviter: { connect: { id: data.inviterId } },
    };
  }

  /**
   * Generates a cryptographically secure random token
   */
  private generateToken(length: number): string {
    // Use URL-safe base64 encoding (no +, /, =)
    return crypto.randomBytes(Math.ceil((length * 3) / 4))
      .toString('base64url')
      .slice(0, length);
  }

  /**
   * Calculates expiration date from now
   */
  private getExpirationDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }
}
