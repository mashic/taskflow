import { Injectable } from '@nestjs/common';
import { Prisma, Task } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    title: string;
    description?: string;
    listId: string;
    boardId: string;
    position: number;
    priority?: string;
    dueDate?: Date;
    assigneeId?: string;
  }): Promise<Task> {
    return this.prisma.task.create({ data });
  }

  async findByList(listId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { listId },
      orderBy: { position: 'asc' },
    });
  }

  async findByBoard(boardId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { id },
    });
  }

  async getMaxPositionInList(listId: string): Promise<number> {
    const result = await this.prisma.task.aggregate({
      where: { listId },
      _max: { position: true },
    });
    return result._max.position ?? 0;
  }

  async update(id: string, data: Prisma.TaskUpdateInput): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data,
    });
  }

  async move(id: string, listId: string, position: number): Promise<Task> {
    return this.prisma.task.update({
      where: { id },
      data: { listId, position },
    });
  }

  async delete(id: string): Promise<Task> {
    return this.prisma.task.delete({
      where: { id },
    });
  }
}
