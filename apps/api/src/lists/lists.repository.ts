import { Injectable } from '@nestjs/common';
import { List, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: { title: string; boardId: string; position: number }): Promise<List> {
    return this.prisma.list.create({ data });
  }

  async findByBoard(boardId: string): Promise<List[]> {
    return this.prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
  }

  async findById(id: string): Promise<List | null> {
    return this.prisma.list.findUnique({
      where: { id },
    });
  }

  async getMaxPosition(boardId: string): Promise<number> {
    const result = await this.prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    });
    return result._max.position ?? 0;
  }

  async update(id: string, data: Prisma.ListUpdateInput): Promise<List> {
    return this.prisma.list.update({
      where: { id },
      data,
    });
  }

  async reorder(id: string, position: number): Promise<List> {
    return this.prisma.list.update({
      where: { id },
      data: { position },
    });
  }

  async delete(id: string): Promise<List> {
    return this.prisma.list.delete({
      where: { id },
    });
  }
}
