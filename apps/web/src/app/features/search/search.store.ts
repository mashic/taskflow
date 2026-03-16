import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { SearchResult } from '@taskflow/shared-types';
import { debounceTime, distinctUntilChanged, filter, pipe, switchMap, tap } from 'rxjs';
import { SearchService } from './search.service';

interface SearchState {
  results: SearchResult[];
  query: string;
  isSearching: boolean;
  error: string | null;
}

const initialState: SearchState = {
  results: [],
  query: '',
  isSearching: false,
  error: null,
};

export const SearchStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    hasResults: computed(() => store.results().length > 0),
    resultCount: computed(() => store.results().length),
    isActive: computed(() => store.query().length > 0 || store.isSearching()),
  })),
  withMethods((store, searchService = inject(SearchService)) => ({
    /**
     * Set query and trigger search with debounce
     */
    search: rxMethod<string>(
      pipe(
        tap((query) => patchState(store, { query })),
        debounceTime(300),
        distinctUntilChanged(),
        filter((query) => query.length >= 2),
        tap(() => patchState(store, { isSearching: true, error: null })),
        switchMap((query) =>
          searchService.search(query).pipe(
            tap({
              next: (results) =>
                patchState(store, { results, isSearching: false }),
              error: (error) =>
                patchState(store, {
                  isSearching: false,
                  error: error.message || 'Search failed',
                }),
            })
          )
        )
      )
    ),

    /**
     * Clear search results and reset state
     */
    clearResults(): void {
      patchState(store, initialState);
    },

    /**
     * Set query without triggering search (for input display)
     */
    setQuery(query: string): void {
      patchState(store, { query });
    },
  }))
);
