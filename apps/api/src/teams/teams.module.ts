import { Module, forwardRef } from '@nestjs/common';
import { InvitationsModule } from '../invitations/invitations.module';
import { TeamsController } from './teams.controller';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';

@Module({
  imports: [forwardRef(() => InvitationsModule)],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository],
  exports: [TeamsService, TeamsRepository],
})
export class TeamsModule {}
