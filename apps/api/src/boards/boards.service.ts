import { ForbiddenException, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { Board } from '@prisma/client';
import { EventsGateway } from '../events/events.gateway';
import { BoardsRepository } from './boards.repository';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsService {
  constructor(
    private boardsRepository: BoardsRepository,
    @Inject(forwardRef(() => EventsGateway))
    private eventsGateway: EventsGateway,
  ) {}

  async create(dto: CreateBoardDto, userId: string): Promise<Board> {
    return this.boardsRepository.create({
      title: dto.title,
      description: dto.description,
      ownerId: userId,
    });
  }

  async findAllForUser(userId: string): Promise<Board[]> {
    return this.boardsRepository.findAllByOwner(userId);
  }

  async findOne(id: string, userId: string): Promise<Board> {
    const board = await this.boardsRepository.findById(id);
    if (!board || board.deletedAt) {
      throw new NotFoundException('Board not found');
    }
    if (board.ownerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return board;
  }

  async update(id: string, dto: UpdateBoardDto, userId: string): Promise<Board> {
    const board = await this.findOne(id, userId);
    const updatedBoard = await this.boardsRepository.update(board.id, dto);
    this.eventsGateway.broadcastBoardUpdated(updatedBoard.id, updatedBoard);
    return updatedBoard;
  }

  async remove(id: string, userId: string): Promise<Board> {
    const board = await this.findOne(id, userId);
    const deletedBoard = await this.boardsRepository.softDelete(board.id);
    this.eventsGateway.broadcastBoardDeleted(board.id);
    return deletedBoard;
  }
}
