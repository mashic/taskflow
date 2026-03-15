import { Injectable } from '@nestjs/common';
import { BoardRole, TeamMember, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeamsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { boardId: string; userId: string; role: BoardRole }): Promise<TeamMember> {
    return this.prisma.teamMember.create({
      data: {
        board: { connect: { id: data.boardId } },
        user: { connect: { id: data.userId } },
        role: data.role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async findByBoardId(boardId: string): Promise<TeamMember[]> {
    return this.prisma.teamMember.findMany({
      where: { boardId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
      orderBy: [
        { role: 'asc' }, // OWNER first, then ADMIN, then MEMBER
        { joinedAt: 'asc' },
      ],
    });
  }

  async findByUserId(userId: string): Promise<TeamMember[]> {
    return this.prisma.teamMember.findMany({
      where: { userId },
      include: {
        board: true,
      },
    });
  }

  async findMember(boardId: string, userId: string): Promise<TeamMember | null> {
    return this.prisma.teamMember.findUnique({
      where: {
        boardId_userId: { boardId, userId },
      },
    });
  }

  async findById(id: string): Promise<TeamMember | null> {
    return this.prisma.teamMember.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async updateRole(id: string, role: BoardRole): Promise<TeamMember> {
    return this.prisma.teamMember.update({
      where: { id },
      data: { role },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.teamMember.delete({
      where: { id },
    });
  }
}
