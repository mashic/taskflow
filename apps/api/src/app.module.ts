import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { EventsModule } from './events/events.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ListsModule } from './lists/lists.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { TasksModule } from './tasks/tasks.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    BoardsModule,
    ListsModule,
    TasksModule,
    EventsModule,
    SearchModule,
    InvitationsModule,
    TeamsModule,
  ],
})
export class AppModule {}
