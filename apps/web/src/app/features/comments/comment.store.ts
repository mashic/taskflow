import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Comment } from '@taskflow/shared-types';
import { pipe, switchMap, tap } from 'rxjs';
import { CommentService } from './comment.service';

interface CommentStoreState {
  selectedTaskId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CommentStoreState = {
  selectedTaskId: null,
  isLoading: false,
  error: null,
};

export const CommentStore = signalStore(
  { providedIn: 'root' },
  withEntities<Comment>(),
  withState(initialState),
  withComputed(({ entities, selectedTaskId }) => ({
    // Get comments for the currently selected task, sorted by creation date
    taskComments: computed(() => {
      const taskId = selectedTaskId();
      if (!taskId) return [];
      return entities()
        .filter((c) => c.taskId === taskId)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }),
    commentCount: computed(() => {
      const taskId = selectedTaskId();
      if (!taskId) return 0;
      return entities().filter((c) => c.taskId === taskId).length;
    }),
  })),
  withMethods((store, commentService = inject(CommentService)) => ({
    // Sync state methods
    setSelectedTask(taskId: string | null): void {
      patchState(store, { selectedTaskId: taskId });
    },

    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading, error: null });
    },

    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },

    clearComments(): void {
      patchState(store, setAllEntities([] as Comment[]), {
        selectedTaskId: null,
      });
    },

    // Direct state updates (for WebSocket real-time sync)
    addComment(comment: Comment): void {
      patchState(store, addEntity(comment));
    },

    updateComment(id: string, changes: Partial<Comment>): void {
      patchState(store, updateEntity({ id, changes }));
    },

    removeComment(id: string): void {
      patchState(store, removeEntity(id));
    },

    // Async API methods using rxMethod
    loadComments: rxMethod<string>(
      pipe(
        tap((taskId) =>
          patchState(store, { selectedTaskId: taskId, isLoading: true, error: null })
        ),
        switchMap((taskId) =>
          commentService.getCommentsByTask(taskId).pipe(
            tapResponse({
              next: (comments: Comment[]) => {
                patchState(store, setAllEntities(comments), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, {
                  error: err.message || 'Failed to load comments',
                  isLoading: false,
                });
              },
            })
          )
        )
      )
    ),

    createComment: rxMethod<{ taskId: string; content: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ taskId, content }) =>
          commentService.createComment(taskId, content).pipe(
            tapResponse({
              next: (comment: Comment) => {
                patchState(store, addEntity(comment), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, {
                  error: err.message || 'Failed to create comment',
                  isLoading: false,
                });
              },
            })
          )
        )
      )
    ),

    deleteComment: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) =>
          commentService.deleteComment(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, {
                  error: err.message || 'Failed to delete comment',
                  isLoading: false,
                });
              },
            })
          )
        )
      )
    ),
  }))
);
