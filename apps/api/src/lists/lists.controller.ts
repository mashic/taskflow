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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
  async create(
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.create(boardId, dto, req.user.id);
  }

  @Get('boards/:boardId/lists')
  async findByBoard(
    @Param('boardId') boardId: string,
    @Request() req: RequestWithUser,
  ): Promise<List[]> {
    return this.listsService.findByBoard(boardId, req.user.id);
  }

  @Get('lists/:id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.findOne(id, req.user.id);
  }

  @Patch('lists/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.update(id, dto, req.user.id);
  }

  @Patch('lists/:id/reorder')
  async reorder(
    @Param('id') id: string,
    @Body() dto: ReorderListDto,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.reorder(id, dto.position, req.user.id);
  }

  @Delete('lists/:id')
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<List> {
    return this.listsService.remove(id, req.user.id);
  }
}
