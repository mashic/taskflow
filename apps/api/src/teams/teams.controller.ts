import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { BoardRole } from '@prisma/client';

class UpdateRoleDto {
  role: BoardRole;
}

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  /**
   * Get all members of a board.
   * GET /teams/board/:boardId/members
   */
  @Get('board/:boardId/members')
  async getMembers(@Param('boardId') boardId: string) {
    return this.teamsService.getMembers(boardId);
  }

  /**
   * Update a member's role.
   * PATCH /teams/members/:id/role
   */
  @Patch('members/:id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.teamsService.updateRole(id, dto.role, req.user.userId);
  }

  /**
   * Remove a member from the board.
   * DELETE /teams/members/:id
   */
  @Delete('members/:id')
  async removeMember(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    await this.teamsService.removeMember(id, req.user.userId);
    return { success: true };
  }

  /**
   * Get all boards the current user is a member of.
   * GET /teams/my-boards
   */
  @Get('my-boards')
  async getMyBoards(@Request() req: { user: { userId: string } }) {
    return this.teamsService.getUserBoards(req.user.userId);
  }
}
