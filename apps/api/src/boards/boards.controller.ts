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
import { Board } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

interface RequestWithUser extends Request {
  user: { id: string; email: string };
}

@Controller('boards')
@UseGuards(JwtAuthGuard)
export class BoardsController {
  constructor(private boardsService: BoardsService) {}

  @Post()
  async create(
    @Body() dto: CreateBoardDto,
    @Request() req: RequestWithUser,
  ): Promise<Board> {
    return this.boardsService.create(dto, req.user.id);
  }

  @Get()
  async findAll(@Request() req: RequestWithUser): Promise<Board[]> {
    return this.boardsService.findAllForUser(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Board> {
    return this.boardsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBoardDto,
    @Request() req: RequestWithUser,
  ): Promise<Board> {
    return this.boardsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Board> {
    return this.boardsService.remove(id, req.user.id);
  }
}
