import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Task } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { MoveTaskDto } from './dto/move-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

interface RequestWithUser extends Request {
  user: { id: string; email: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('lists/:listId/tasks')
  async create(
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.create(listId, dto, req.user.id);
  }

  @Get('boards/:boardId/tasks')
  async findByBoard(
    @Param('boardId') boardId: string,
    @Request() req: RequestWithUser,
  ): Promise<Task[]> {
    return this.tasksService.findByBoard(boardId, req.user.id);
  }

  @Get('tasks/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.findOne(id, req.user.id);
  }

  @Patch('tasks/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.update(id, dto, req.user.id);
  }

  @Patch('tasks/:id/move')
  async move(
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.move(id, dto, req.user.id);
  }

  @Delete('tasks/:id')
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.remove(id, req.user.id);
  }
}
