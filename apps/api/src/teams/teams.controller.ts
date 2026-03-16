import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Request,
    UseGuards,
} from '@nestjs/common';
import { BoardRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequirePermission } from '../permissions/decorators/require-permission.decorator';
import { BoardPermissionGuard } from '../permissions/permissions.guard';
import { TeamsService } from './teams.service';

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
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('read')
  async getMembers(@Param('boardId') boardId: string) {
    return this.teamsService.getMembers(boardId);
  }

  /**
   * Update a member's role.
   * PATCH /teams/members/:id/role
   */
  @Patch('members/:id/role')
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('manageMembers')
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
  @UseGuards(BoardPermissionGuard)
  @RequirePermission('manageMembers')
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
