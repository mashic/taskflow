import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { EventsModule } from '../events/events.module';
import { ListsModule } from '../lists/lists.module';
import { TasksController } from './tasks.controller';
import { TasksRepository } from './tasks.repository';
import { TasksService } from './tasks.service';

@Module({
  imports: [BoardsModule, ListsModule, EventsModule],
  controllers: [TasksController],
  providers: [TasksService, TasksRepository],
  exports: [TasksService, TasksRepository],
})
export class TasksModule {}
