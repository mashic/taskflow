/**
 * SearchQueryBuilder - Builder pattern for constructing PostgreSQL full-text search queries.
 *
 * Uses fluent API to construct FTS queries step by step:
 * - setSearchTerm(): Set the search query
 * - filterByBoard(): Scope search to specific board
 * - paginate(): Set limit and offset
 * - build(): Generate the final SQL query with parameters
 *
 * Interview talking point: "I used the Builder pattern for search queries because FTS queries
 * have many optional parts - search term, table selection, filters, pagination. The builder
 * allows constructing queries fluently and makes the code readable while handling SQL
 * generation internally."
 */
export class SearchQueryBuilder {
  private searchTerm: string = '';
  private boardIdFilter: string | null = null;
  private limit: number = 20;
  private offset: number = 0;

  /**
   * Set the search term for full-text search
   */
  setSearchTerm(term: string): this {
    this.searchTerm = term.trim();
    return this;
  }

  /**
   * Filter results to a specific board
   */
  filterByBoard(boardId: string): this {
    this.boardIdFilter = boardId;
    return this;
  }

  /**
   * Set pagination parameters
   */
  paginate(limit: number, offset: number = 0): this {
    this.limit = Math.max(1, Math.min(limit, 100)); // Cap at 100
    this.offset = Math.max(0, offset);
    return this;
  }

  /**
   * Build the PostgreSQL full-text search query
   * Returns SQL string and parameter array for use with $queryRawUnsafe
   */
  build(): { sql: string; params: unknown[] } {
    if (!this.searchTerm) {
      throw new Error('Search term is required');
    }

    const params: unknown[] = [this.searchTerm];
    const conditions: string[] = [
      `to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')) @@ websearch_to_tsquery('english', $1)`,
    ];

    if (this.boardIdFilter) {
      params.push(this.boardIdFilter);
      conditions.push(`t.board_id = $${params.length}`);
    }

    params.push(this.limit, this.offset);

    const sql = `
      SELECT 
        'task' as type,
        t.id,
        t.title,
        t.description,
        t.board_id as "boardId",
        t.list_id as "listId",
        ts_rank(
          to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')),
          websearch_to_tsquery('english', $1)
        ) as rank
      FROM tasks t
      WHERE ${conditions.join(' AND ')}
      ORDER BY rank DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    return { sql, params };
  }
}
