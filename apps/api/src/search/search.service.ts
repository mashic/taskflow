import { Injectable, Logger } from '@nestjs/common';
import { SearchResult } from '@taskflow/shared-types';
import { PrismaService } from '../prisma/prisma.service';
import { SearchQueryBuilder } from './builders/search-query.builder';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search tasks using PostgreSQL full-text search with the Builder pattern.
   * Returns results ranked by relevance.
   */
  async search(
    query: string,
    boardId?: string,
    limit = 20,
    offset = 0,
  ): Promise<SearchResult[]> {
    if (!query?.trim()) {
      return [];
    }

    // Use Builder pattern to construct the FTS query
    const builder = new SearchQueryBuilder()
      .setSearchTerm(query)
      .paginate(limit, offset);

    if (boardId) {
      builder.filterByBoard(boardId);
    }

    const { sql, params } = builder.build();

    this.logger.debug(`Executing search: "${query}" with ${params.length} params`);

    try {
      const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(
        sql,
        ...params,
      );

      return results.map((result) => ({
        ...result,
        rank: Number(result.rank), // Ensure rank is a number
      }));
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
