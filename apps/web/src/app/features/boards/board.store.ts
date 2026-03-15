import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Board, CreateBoardDto, UpdateBoardDto } from '@taskflow/shared-types';
import { pipe, switchMap, tap } from 'rxjs';
import { BoardService } from './board.service';

interface BoardStoreState {
  isLoading: boolean;
  error: string | null;
  selectedBoardId: string | null;
}

const initialState: BoardStoreState = {
  isLoading: false,
  error: null,
  selectedBoardId: null,
};

export const BoardStore = signalStore(
  { providedIn: 'root' },
  withEntities<Board>(),
  withState(initialState),
  withComputed(({ entities, selectedBoardId }) => ({
    selectedBoard: computed(() => {
      const id = selectedBoardId();
      return id ? entities().find((b) => b.id === id) ?? null : null;
    }),
    boardCount: computed(() => entities().length),
    hasBoards: computed(() => entities().length > 0),
  })),
  withMethods((store, boardService = inject(BoardService)) => ({
    // Sync state methods
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading, error: null });
    },

    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },

    setSelectedBoard(id: string | null): void {
      patchState(store, { selectedBoardId: id });
    },

    // Entity sync methods (for optimistic updates)
    addBoard(board: Board): void {
      patchState(store, addEntity(board));
    },

    updateBoard(id: string, changes: Partial<Board>): void {
      patchState(store, updateEntity({ id, changes }));
    },

    removeBoard(id: string): void {
      patchState(store, removeEntity(id));
    },

    setBoards(boards: Board[]): void {
      patchState(store, setAllEntities(boards));
    },

    // Async API methods using rxMethod
    loadBoards: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() =>
          boardService.getBoards().pipe(
            tapResponse({
              next: (boards: Board[]) => {
                patchState(store, setAllEntities(boards), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to load boards', isLoading: false });
              },
            })
          )
        )
      )
    ),

    createBoard: rxMethod<CreateBoardDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((dto) =>
          boardService.createBoard(dto).pipe(
            tapResponse({
              next: (board: Board) => {
                patchState(store, addEntity(board), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to create board', isLoading: false });
              },
            })
          )
        )
      )
    ),

    updateBoardAsync: rxMethod<{ id: string; dto: UpdateBoardDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ id, dto }) =>
          boardService.updateBoard(id, dto).pipe(
            tapResponse({
              next: (board: Board) => {
                patchState(store, updateEntity({ id, changes: board }), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to update board', isLoading: false });
              },
            })
          )
        )
      )
    ),

    deleteBoard: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) =>
          boardService.deleteBoard(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id), { isLoading: false, selectedBoardId: null });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to delete board', isLoading: false });
              },
            })
          )
        )
      )
    ),
  }))
);
