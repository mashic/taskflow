import { Injectable } from '@nestjs/common';
import { Board, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BoardsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; description?: string; ownerId: string }): Promise<Board> {
    return this.prisma.board.create({ data });
  }

  async findAllByOwner(ownerId: string): Promise<Board[]> {
    return this.prisma.board.findMany({
      where: {
        ownerId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Board | null> {
    return this.prisma.board.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.BoardUpdateInput): Promise<Board> {
    return this.prisma.board.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Board> {
    return this.prisma.board.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
