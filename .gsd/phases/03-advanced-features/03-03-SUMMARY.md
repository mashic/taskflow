---
phase: 03-advanced-features
plan: 03
subsystem: search
tags: [fts, builder-pattern, postgresql, signalstore]
dependency-graph:
  requires: [01-01, 01-02, 02-01]
  provides: [full-text-search, search-api, search-ui]
  affects: [03-04]
tech-stack:
  added: []
  patterns: [builder-pattern]
key-files:
  created:
    - apps/api/src/search/builders/search-query.builder.ts
    - apps/api/src/search/search.service.ts
    - apps/api/src/search/search.controller.ts
    - apps/api/src/search/search.module.ts
    - apps/web/src/app/features/search/search.service.ts
    - apps/web/src/app/features/search/search.store.ts
    - apps/web/src/app/features/search/search-results.ts
  modified:
    - packages/shared-types/src/index.ts
    - apps/api/src/app.module.ts
    - apps/web/src/app/core/layout/header.ts
decisions: []
metrics:
  duration: ~3m
  completed: 2026-03-15
---

# Phase 3 Plan 3: Full-Text Search with Builder Pattern Summary

**One-liner:** PostgreSQL full-text search with SearchQueryBuilder fluent API and global header search UI.

## What Was Built

### Backend (NestJS)

1. **SearchQueryBuilder** (`apps/api/src/search/builders/search-query.builder.ts`)
   - Fluent API with `setSearchTerm()`, `filterByBoard()`, `paginate()`
   - Generates PostgreSQL FTS queries using `websearch_to_tsquery`
   - Uses `ts_rank` for relevance scoring
   - Demonstrates Builder pattern (GoF) for complex query construction

2. **Search Module**
   - `SearchService` - Uses builder pattern, executes raw SQL via Prisma
   - `SearchController` - `GET /search?q=term&boardId=xxx&limit=20`
   - JWT-protected endpoint

### Frontend (Angular 21)

1. **SearchStore** (`search.store.ts`)
   - SignalStore with debounced search (300ms)
   - State: `results`, `query`, `isSearching`, `error`
   - Computed: `hasResults`, `resultCount`, `isActive`

2. **SearchResultsComponent** (`search-results.ts`)
   - Displays ranked results with relevance stars
   - Links to board/task on click
   - Handles loading, error, and empty states

3. **Header Integration**
   - Global search input in header
   - Dropdown shows results on type
   - Click outside to close

### Shared Types

```typescript
interface SearchResult {
  type: 'task';
  id: string;
  title: string;
  description: string | null;
  boardId: string;
  listId: string;
  rank: number;
}
```

## Design Pattern: Builder Pattern

**Interview talking point:** "I used the Builder pattern for search queries because FTS queries have many optional parts - search term, filters, pagination. The builder allows constructing queries fluently with method chaining like `.setSearchTerm('bug').filterByBoard(id).paginate(10, 0).build()` and makes the code readable while handling SQL generation internally. Each method returns `this`, enabling a fluent interface."

```typescript
// Builder pattern usage example
const builder = new SearchQueryBuilder()
  .setSearchTerm('fix button')
  .filterByBoard('board-123')
  .paginate(20, 0);

const { sql, params } = builder.build();
// PostgreSQL FTS query with websearch_to_tsquery
```

## Commits

| Hash | Message |
|------|---------|
| 22b068e | feat: full-text search with Builder pattern (03-03) |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

- Search feature ready for integration with other modules
- Can be extended to search comments (after 03-01) and activities (after 03-02)
- GIN index on tsvector columns can be added as optimization if needed
