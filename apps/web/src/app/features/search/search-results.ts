import { Component, inject, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SearchResult } from '@taskflow/shared-types';
import { SearchStore } from './search.store';

@Component({
  selector: 'app-search-results',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="search-results">
      @if (store.isSearching()) {
        <div class="search-loading">Searching...</div>
      } @else if (store.error()) {
        <div class="search-error">{{ store.error() }}</div>
      } @else if (store.hasResults()) {
        <div class="results-list">
          @for (result of store.results(); track result.id) {
            <a 
              class="result-item"
              [routerLink]="['/boards', result.boardId]"
              [queryParams]="{ taskId: result.id }"
              (click)="onResultClick(result)"
            >
              <div class="result-title">{{ result.title }}</div>
              @if (result.description) {
                <div class="result-description">
                  {{ truncate(result.description, 80) }}
                </div>
              }
              <div class="result-meta">
                <span class="relevance" [title]="'Relevance: ' + result.rank.toFixed(2)">
                  @for (i of getRelevanceStars(result.rank); track $index) {
                    ★
                  }
                </span>
              </div>
            </a>
          }
        </div>
        <div class="results-count">
          {{ store.resultCount() }} result{{ store.resultCount() === 1 ? '' : 's' }}
        </div>
      } @else if (store.query().length >= 2) {
        <div class="no-results">No tasks found for "{{ store.query() }}"</div>
      } @else if (store.query().length > 0) {
        <div class="hint">Type at least 2 characters to search</div>
      }
    </div>
  `,
  styles: [`
    .search-results {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 400px;
      overflow-y: auto;
      min-width: 320px;
    }
    .search-loading, .search-error, .no-results, .hint {
      padding: 1rem;
      text-align: center;
      color: #666;
    }
    .search-error { color: #dc2626; }
    .results-list { padding: 0.5rem 0; }
    .result-item {
      display: block;
      padding: 0.75rem 1rem;
      text-decoration: none;
      color: inherit;
      border-bottom: 1px solid #eee;
      transition: background 0.15s;
    }
    .result-item:hover { background: #f5f5f5; }
    .result-item:last-child { border-bottom: none; }
    .result-title {
      font-weight: 500;
      color: #1a1a2e;
      margin-bottom: 0.25rem;
    }
    .result-description {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.25rem;
    }
    .result-meta {
      display: flex;
      justify-content: flex-end;
      font-size: 0.75rem;
    }
    .relevance { color: #f59e0b; }
    .results-count {
      padding: 0.5rem 1rem;
      font-size: 0.75rem;
      color: #888;
      border-top: 1px solid #eee;
      text-align: center;
    }
  `],
})
export class SearchResultsComponent {
  store = inject(SearchStore);
  resultSelected = output<SearchResult>();

  onResultClick(result: SearchResult): void {
    this.resultSelected.emit(result);
    this.store.clearResults();
  }

  truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
  }

  getRelevanceStars(rank: number): number[] {
    // Convert rank (typically 0-1) to 1-5 stars
    const stars = Math.min(5, Math.max(1, Math.ceil(rank * 5)));
    return Array(stars).fill(0);
  }
}
