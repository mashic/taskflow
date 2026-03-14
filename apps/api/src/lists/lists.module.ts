import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { EventsModule } from '../events/events.module';
import { ListsController } from './lists.controller';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';

@Module({
  imports: [BoardsModule, EventsModule],
  controllers: [ListsController],
  providers: [ListsService, ListsRepository],
  exports: [ListsService, ListsRepository],
})
export class ListsModule {}
