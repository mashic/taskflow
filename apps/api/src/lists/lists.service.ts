import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { List } from '@prisma/client';
import { BoardsService } from '../boards/boards.service';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListsRepository } from './lists.repository';

@Injectable()
export class ListsService {
  constructor(
    private listsRepository: ListsRepository,
    private boardsService: BoardsService,
  ) {}

  async create(boardId: string, dto: CreateListDto, userId: string): Promise<List> {
    // Verify board ownership
    await this.boardsService.findOne(boardId, userId);
    
    // Get max position and add 1
    const maxPosition = await this.listsRepository.getMaxPosition(boardId);
    
    return this.listsRepository.create({
      title: dto.title,
      boardId,
      position: maxPosition + 1,
    });
  }

  async findByBoard(boardId: string, userId: string): Promise<List[]> {
    // Verify board ownership
    await this.boardsService.findOne(boardId, userId);
    
    return this.listsRepository.findByBoard(boardId);
  }

  async findOne(id: string, userId: string): Promise<List> {
    const list = await this.listsRepository.findById(id);
    if (!list) {
      throw new NotFoundException('List not found');
    }
    
    // Verify board ownership
    await this.boardsService.findOne(list.boardId, userId);
    
    return list;
  }

  async update(id: string, dto: UpdateListDto, userId: string): Promise<List> {
    const list = await this.findOne(id, userId);
    return this.listsRepository.update(list.id, dto);
  }

  async reorder(id: string, position: number, userId: string): Promise<List> {
    const list = await this.findOne(id, userId);
    return this.listsRepository.reorder(list.id, position);
  }

  async remove(id: string, userId: string): Promise<List> {
    const list = await this.findOne(id, userId);
    return this.listsRepository.delete(list.id);
  }
}
