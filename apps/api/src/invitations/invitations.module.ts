import { Module, forwardRef } from '@nestjs/common';
import { TeamsModule } from '../teams/teams.module';
import { InvitationFactory } from './factories/invitation.factory';
import { InvitationsController } from './invitations.controller';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';

@Module({
  imports: [forwardRef(() => TeamsModule)],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository, InvitationFactory],
  exports: [InvitationsService, InvitationFactory],
})
export class InvitationsModule {}
