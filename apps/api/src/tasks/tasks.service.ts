import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Task } from '@prisma/client';
import { BoardsService } from '../boards/boards.service';
import { EventsGateway } from '../events/events.gateway';
import { ListsRepository } from '../lists/lists.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(
    private tasksRepository: TasksRepository,
    private listsRepository: ListsRepository,
    private boardsService: BoardsService,
    private eventsGateway: EventsGateway,
  ) {}

  async create(listId: string, dto: CreateTaskDto, userId: string): Promise<Task> {
    // Verify list exists and user owns the board
    const list = await this.listsRepository.findById(listId);
    if (!list) {
      throw new NotFoundException('List not found');
    }
    
    await this.boardsService.findOne(list.boardId, userId);
    
    // Get max position and add 1
    const maxPosition = await this.tasksRepository.getMaxPositionInList(listId);
    
    const task = await this.tasksRepository.create({
      title: dto.title,
      description: dto.description,
      listId,
      boardId: list.boardId,
      position: maxPosition + 1,
      priority: dto.priority,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      assigneeId: dto.assigneeId,
    });

    this.eventsGateway.broadcastTaskCreated(task.boardId, task);
    return task;
  }

  async findByBoard(boardId: string, userId: string): Promise<Task[]> {
    // Verify board ownership
    await this.boardsService.findOne(boardId, userId);
    
    return this.tasksRepository.findByBoard(boardId);
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findById(id);
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    
    // Verify board ownership
    await this.boardsService.findOne(task.boardId, userId);
    
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);
    
    const updateData: Record<string, unknown> = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.dueDate !== undefined) updateData.dueDate = new Date(dto.dueDate);
    if (dto.assigneeId !== undefined) updateData.assigneeId = dto.assigneeId;
    
    const updatedTask = await this.tasksRepository.update(task.id, updateData);
    this.eventsGateway.broadcastTaskUpdated(updatedTask.boardId, updatedTask);
    return updatedTask;
  }

  async move(id: string, dto: MoveTaskDto, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);
    
    // Verify target list exists and belongs to same board
    const targetList = await this.listsRepository.findById(dto.listId);
    if (!targetList) {
      throw new NotFoundException('Target list not found');
    }
    
    if (targetList.boardId !== task.boardId) {
      throw new ForbiddenException('Cannot move task to a different board');
    }
    
    const movedTask = await this.tasksRepository.move(task.id, dto.listId, dto.position);
    this.eventsGateway.broadcastTaskMoved(movedTask.boardId, movedTask);
    return movedTask;
  }

  async remove(id: string, userId: string): Promise<Task> {
    const task = await this.findOne(id, userId);
    const deletedTask = await this.tasksRepository.delete(task.id);
    this.eventsGateway.broadcastTaskDeleted(task.boardId, task.id);
    return deletedTask;
  }
}
