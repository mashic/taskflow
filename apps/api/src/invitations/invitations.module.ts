import { Module, forwardRef } from '@nestjs/common';
import { InvitationsController } from './invitations.controller';
import { InvitationsService } from './invitations.service';
import { InvitationsRepository } from './invitations.repository';
import { InvitationFactory } from './factories/invitation.factory';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [forwardRef(() => TeamsModule)],
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository, InvitationFactory],
  exports: [InvitationsService, InvitationFactory],
})
export class InvitationsModule {}
