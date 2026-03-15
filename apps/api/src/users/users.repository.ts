import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });
  }

  async findByNames(names: string[]): Promise<User[]> {
    if (names.length === 0) return [];
    return this.prisma.user.findMany({
      where: {
        name: {
          in: names,
          mode: 'insensitive',
        },
      },
    });
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }
}
