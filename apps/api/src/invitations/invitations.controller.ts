import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationsService } from './invitations.service';
import { CreateEmailInvitationDto, CreateLinkInvitationDto } from './dto/create-invitation.dto';

@Controller('invitations')
@UseGuards(JwtAuthGuard)
export class InvitationsController {
  constructor(private invitationsService: InvitationsService) {}

  /**
   * Create an email invitation for a specific user.
   * POST /invitations/email
   */
  @Post('email')
  async createEmailInvitation(
    @Body() dto: CreateEmailInvitationDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.invitationsService.createEmailInvitation(dto, req.user.userId);
  }

  /**
   * Create a shareable link invitation.
   * POST /invitations/link
   */
  @Post('link')
  async createLinkInvitation(
    @Body() dto: CreateLinkInvitationDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.invitationsService.createLinkInvitation(dto, req.user.userId);
  }

  /**
   * Get invitation details by token (for preview before accepting).
   * GET /invitations/token/:token
   */
  @Get('token/:token')
  async getByToken(@Param('token') token: string) {
    return this.invitationsService.getByToken(token);
  }

  /**
   * Accept an invitation and join the board.
   * POST /invitations/accept/:token
   */
  @Post('accept/:token')
  async acceptInvitation(
    @Param('token') token: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.invitationsService.acceptInvitation(token, req.user.userId);
  }

  /**
   * Get all invitations for a board.
   * GET /invitations/board/:boardId
   */
  @Get('board/:boardId')
  async getByBoard(@Param('boardId') boardId: string) {
    return this.invitationsService.getByBoard(boardId);
  }

  /**
   * Revoke an invitation.
   * DELETE /invitations/:id
   */
  @Delete(':id')
  async revoke(
    @Param('id') id: string,
    @Request() req: { user: { userId: string } },
  ) {
    await this.invitationsService.revoke(id, req.user.userId);
    return { success: true };
  }
}
