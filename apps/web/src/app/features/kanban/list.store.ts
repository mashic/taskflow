import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { CreateListDto, List, UpdateListDto } from '@taskflow/shared-types';
import { pipe, switchMap, tap } from 'rxjs';
import { ListService } from './list.service';

interface ListStoreState {
  currentBoardId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ListStoreState = {
  currentBoardId: null,
  isLoading: false,
  error: null,
};

export const ListStore = signalStore(
  { providedIn: 'root' },
  withEntities<List>(),
  withState(initialState),
  withComputed(({ entities }) => ({
    sortedLists: computed(() =>
      [...entities()].sort((a, b) => a.position - b.position)
    ),
    listCount: computed(() => entities().length),
    hasLists: computed(() => entities().length > 0),
  })),
  withMethods((store, listService = inject(ListService)) => ({
    // Sync state methods
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading, error: null });
    },

    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },

    clearLists(): void {
      patchState(store, setAllEntities([] as List[]), { currentBoardId: null });
    },

    // Entity sync methods (for optimistic updates)
    addList(list: List): void {
      patchState(store, addEntity(list));
    },

    updateList(id: string, changes: Partial<List>): void {
      patchState(store, updateEntity({ id, changes }));
    },

    removeList(id: string): void {
      patchState(store, removeEntity(id));
    },

    setLists(lists: List[]): void {
      patchState(store, setAllEntities(lists));
    },

    reorderList(id: string, newPosition: number): void {
      patchState(store, updateEntity({ id, changes: { position: newPosition } }));
    },

    // Async API methods using rxMethod
    loadListsForBoard: rxMethod<string>(
      pipe(
        tap((boardId) => patchState(store, { currentBoardId: boardId, isLoading: true, error: null })),
        switchMap((boardId) =>
          listService.getListsForBoard(boardId).pipe(
            tapResponse({
              next: (lists: List[]) => {
                patchState(store, setAllEntities(lists), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to load lists', isLoading: false });
              },
            })
          )
        )
      )
    ),

    createList: rxMethod<CreateListDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((dto) =>
          listService.createList(dto).pipe(
            tapResponse({
              next: (list: List) => {
                patchState(store, addEntity(list), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to create list', isLoading: false });
              },
            })
          )
        )
      )
    ),

    updateListAsync: rxMethod<{ id: string; dto: UpdateListDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ id, dto }) =>
          listService.updateList(id, dto).pipe(
            tapResponse({
              next: (list: List) => {
                patchState(store, updateEntity({ id, changes: list }), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to update list', isLoading: false });
              },
            })
          )
        )
      )
    ),

    reorderListAsync: rxMethod<{ id: string; position: number }>(
      pipe(
        tap(({ id, position }) => {
          // Optimistic update
          patchState(store, updateEntity({ id, changes: { position } }));
        }),
        switchMap(({ id, position }) =>
          listService.reorderList(id, position).pipe(
            tapResponse({
              next: (list: List) => {
                patchState(store, updateEntity({ id, changes: list }));
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to reorder list' });
              },
            })
          )
        )
      )
    ),

    deleteList: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) =>
          listService.deleteList(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to delete list', isLoading: false });
              },
            })
          )
        )
      )
    ),
  }))
);
