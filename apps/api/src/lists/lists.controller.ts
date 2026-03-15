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
import { List } from '@prisma/client';
import { AuditLog } from '../activity/decorators/audit-log.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardPermissionGuard } from '../permissions/permissions.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { CreateListDto } from './dto/create-list.dto';
import { ReorderListDto } from './dto/reorder-list.dto';
import { UpdateListDto } from './dto/update-list.dto';
import { ListsService } from './lists.service';

interface RequestWithUser extends Request {
  user: { id: string; email: string };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ListsController {
  constructor(private listsService: ListsService) {}

  @Post('boards/:boardId/lists')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'created', entity: 'list' })
  async create(
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.create(boardId, dto, req.user.id);
  }

  @Get('boards/:boardId/lists')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('read')
  async findByBoard(
    @Param('boardId') boardId: string,
    @Request() req: RequestWithUser,
  ): Promise<List[]> {
    return this.listsService.findByBoard(boardId, req.user.id);
  }

  @Get('lists/:id')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('read')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.findOne(id, req.user.id);
  }

  @Patch('lists/:id')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'updated', entity: 'list' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.update(id, dto, req.user.id);
  }

  @Patch('lists/:id/reorder')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'moved', entity: 'list' })
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderListDto,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.reorder(id, dto.position, req.user.id);
  }

  @Delete('lists/:id')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('write')
  @AuditLog({ action: 'deleted', entity: 'list' })
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.remove(id, req.user.id);
  }
}
