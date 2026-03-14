import { Module } from '@nestjs/common';
import { BoardsModule } from '../boards/boards.module';
import { ListsController } from './lists.controller';
import { ListsRepository } from './lists.repository';
import { ListsService } from './lists.service';

@Module({
  imports: [BoardsModule],
  controllers: [ListsController],
  providers: [ListsService, ListsRepository],
  exports: [ListsService, ListsRepository],
})
export class ListsModule {}
