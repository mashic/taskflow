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
import { AuditLog } from '../activity/decorators/audit-log.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { BoardPermissionGuard } from '../permissions/permissions.guard';
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
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'created', entity: 'task' })
  async create(
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.create(listId, dto, req.user.id);
  }

  @Get('boards/:boardId/tasks')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('read')
  async findByBoard(
    @Param('boardId') boardId: string,
    @Request() req: RequestWithUser,
  ): Promise<Task[]> {
    return this.tasksService.findByBoard(boardId, req.user.id);
  }

  @Get('tasks/:id')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('read')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.findOne(id, req.user.id);
  }

  @Patch('tasks/:id')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'updated', entity: 'task' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.update(id, dto, req.user.id);
  }

  @Patch('tasks/:id/move')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'moved', entity: 'task' })
  async move(
    @Param('id') id: string,
    @Body() dto: MoveTaskDto,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.move(id, dto, req.user.id);
  }

  @Delete('tasks/:id')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'deleted', entity: 'task' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Task> {
    return this.tasksService.remove(id, req.user.id);
  }
}
