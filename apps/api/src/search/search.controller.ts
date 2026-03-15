import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SearchResult } from '@taskflow/shared-types';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  /**
   * Search tasks by query string using PostgreSQL full-text search.
   * 
   * Query parameters:
   * - q: Search term (required)
   * - boardId: Filter by board (optional)
   * - limit: Max results (default 20, max 100)
   * - offset: Pagination offset (default 0)
   */
  @Get()
  async search(
    @Query('q') query: string,
    @Query('boardId') boardId?: string,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ): Promise<SearchResult[]> {
    if (!query?.trim()) {
      throw new BadRequestException('Search query is required');
    }

    const limit = limitStr ? parseInt(limitStr, 10) : 20;
    const offset = offsetStr ? parseInt(offsetStr, 10) : 0;

    return this.searchService.search(query, boardId, limit, offset);
  }
}
