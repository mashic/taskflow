import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(private usersRepository: UsersRepository) {}

  async create(email: string, password: string, name?: string): Promise<User> {
    const existing = await this.usersRepository.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    return this.usersRepository.create({
      email,
      password: hashedPassword,
      name: name || null,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.usersRepository.updateRefreshToken(id, refreshToken);
  }
}
