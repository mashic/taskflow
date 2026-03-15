import { Injectable } from '@nestjs/common';
import { Invitation, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvitationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.InvitationCreateInput): Promise<Invitation> {
    return this.prisma.invitation.create({ data });
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.prisma.invitation.findUnique({
      where: { token },
      include: {
        board: true,
        inviter: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async findByBoardId(boardId: string): Promise<Invitation[]> {
    return this.prisma.invitation.findMany({
      where: { boardId },
      include: {
        inviter: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Invitation | null> {
    return this.prisma.invitation.findUnique({
      where: { id },
    });
  }

  async incrementUsedCount(id: string): Promise<Invitation> {
    return this.prisma.invitation.update({
      where: { id },
      data: { usedCount: { increment: 1 } },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invitation.delete({
      where: { id },
    });
  }
}
