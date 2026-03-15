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
import { AuditLog } from '../activity/decorators/audit-log.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

interface AuthenticatedRequest {
  user: { sub: string; email: string };
}

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  @AuditLog({ action: 'commented', entity: 'comment' })
  create(@Body() dto: CreateCommentDto, @Request() req: AuthenticatedRequest) {
    return this.commentsService.create(dto, req.user.sub);
  }

  @Get('task/:taskId')
  findByTask(@Param('taskId') taskId: string) {
    return this.commentsService.findByTaskId(taskId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.commentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.commentsService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @AuditLog({ action: 'deleted', entity: 'comment' })
  delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.commentsService.delete(id, req.user.sub);
  }
}
