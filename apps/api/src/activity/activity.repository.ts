import { Injectable } from '@nestjs/common';
import { Activity, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateActivityData {
  type: string;
  entityType: string;
  entityId: string;
  boardId: string;
  userId: string;
  data?: Prisma.InputJsonValue;
}

@Injectable()
export class ActivityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateActivityData): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        type: data.type,
        entityType: data.entityType,
        entityId: data.entityId,
        boardId: data.boardId,
        userId: data.userId,
        data: data.data ?? Prisma.JsonNull,
      },
    });
  }

  async findByBoardId(
    boardId: string,
    limit = 50,
  ): Promise<(Activity & { user: { id: string; name: string | null; email: string } })[]> {
    return this.prisma.activity.findMany({
      where: { boardId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
  ): Promise<(Activity & { user: { id: string; name: string | null; email: string } })[]> {
    return this.prisma.activity.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
