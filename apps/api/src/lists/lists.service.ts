import { Injectable, NotFoundException } from '@nestjs/common';
import { List } from '@prisma/client';
import { BoardsService } from '../boards/boards.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateListDto } from './dto/create-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListsRepository } from './lists.repository';

@Injectable()
export class ListsService {
  constructor(
    private listsRepository: ListsRepository,
    private boardsService: BoardsService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(boardId: string, dto: CreateListDto, userId: string): Promise<List> {
    // Verify board ownership
    await this.boardsService.findOne(boardId, userId);
    
    // Get max position and add 1
    const maxPosition = await this.listsRepository.getMaxPosition(boardId);
    
    const list = await this.listsRepository.create({
      title: dto.title,
      boardId,
      position: maxPosition + 1,
    });

    this.eventsGateway.broadcastListCreated(boardId, list);
    return list;
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
    const updatedList = await this.listsRepository.update(list.id, dto);
    this.eventsGateway.broadcastListUpdated(list.boardId, updatedList);
    return updatedList;
  }

  async reorder(id: string, position: number, userId: string): Promise<List> {
    const list = await this.findOne(id, userId);
    const reorderedList = await this.listsRepository.reorder(list.id, position);
    this.eventsGateway.broadcastListReordered(list.boardId, reorderedList);
    return reorderedList;
  }

  async remove(id: string, userId: string): Promise<List> {
    const list = await this.findOne(id, userId);
    const deletedList = await this.listsRepository.delete(list.id);
    this.eventsGateway.broadcastListDeleted(list.boardId, list.id);
    return deletedList;
  }
}
