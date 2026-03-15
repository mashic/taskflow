import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { addEntity, removeEntity, setAllEntities, setEntity, updateEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { CreateTaskDto, Task, UpdateTaskDto } from '@taskflow/shared-types';
import { pipe, switchMap, tap } from 'rxjs';
import { TaskService } from './task.service';

interface TaskStoreState {
  currentBoardId: string | null;
  isLoading: boolean;
  error: string | null;
  pendingMoves: Record<string, Task>; // taskId -> original state for rollback
}

const initialState: TaskStoreState = {
  currentBoardId: null,
  isLoading: false,
  error: null,
  pendingMoves: {},
};

export const TaskStore = signalStore(
  { providedIn: 'root' },
  withEntities<Task>(),
  withState(initialState),
  withComputed(({ entities }) => ({
    // Get tasks for a specific list, sorted by position
    tasksByList: computed(() => {
      const tasks = entities();
      const grouped = new Map<string, Task[]>();
      for (const task of tasks) {
        const listTasks = grouped.get(task.listId) || [];
        listTasks.push(task);
        grouped.set(task.listId, listTasks);
      }
      // Sort each list's tasks by position
      for (const [listId, listTasks] of grouped) {
        grouped.set(listId, [...listTasks].sort((a, b) => a.position - b.position));
      }
      return grouped;
    }),
    taskCount: computed(() => entities().length),
    hasTasks: computed(() => entities().length > 0),
  })),
  withMethods((store, taskService = inject(TaskService)) => ({
    // Sync state methods
    setLoading(isLoading: boolean): void {
      patchState(store, { isLoading, error: null });
    },

    setError(error: string | null): void {
      patchState(store, { error, isLoading: false });
    },

    clearTasks(): void {
      patchState(store, setAllEntities([] as Task[]), { currentBoardId: null, pendingMoves: {} });
    },

    // Entity sync methods (for optimistic updates)
    addTask(task: Task): void {
      patchState(store, addEntity(task));
    },

    updateTask(id: string, changes: Partial<Task>): void {
      patchState(store, updateEntity({ id, changes }));
    },

    removeTask(id: string): void {
      patchState(store, removeEntity(id));
    },

    setTasks(tasks: Task[]): void {
      patchState(store, setAllEntities(tasks));
    },

    // Get tasks for a specific list
    getTasksForList(listId: string): Task[] {
      return store.tasksByList().get(listId) ?? [];
    },

    // Async API methods using rxMethod
    loadTasksForBoard: rxMethod<string>(
      pipe(
        tap((boardId) => patchState(store, { currentBoardId: boardId, isLoading: true, error: null })),
        switchMap((boardId) =>
          taskService.getTasksForBoard(boardId).pipe(
            tapResponse({
              next: (tasks: Task[]) => {
                patchState(store, setAllEntities(tasks), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to load tasks', isLoading: false });
              },
            })
          )
        )
      )
    ),

    createTask: rxMethod<CreateTaskDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((dto) =>
          taskService.createTask(dto).pipe(
            tapResponse({
              next: (task: Task) => {
                patchState(store, addEntity(task), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to create task', isLoading: false });
              },
            })
          )
        )
      )
    ),

    updateTaskAsync: rxMethod<{ id: string; dto: UpdateTaskDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ id, dto }) =>
          taskService.updateTask(id, dto).pipe(
            tapResponse({
              next: (task: Task) => {
                patchState(store, updateEntity({ id, changes: task }), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to update task', isLoading: false });
              },
            })
          )
        )
      )
    ),

    // Optimistic move with rollback capability
    moveTask: rxMethod<{ taskId: string; listId: string; position: number }>(
      pipe(
        tap(({ taskId, listId, position }) => {
          // Store original state for rollback
          const entityMap = store.entityMap();
          const original = entityMap[taskId];
          if (original) {
            const pendingMoves = { ...store.pendingMoves(), [taskId]: original };
            patchState(store, { pendingMoves });
          }
          // Optimistically update
          patchState(store, updateEntity({ id: taskId, changes: { listId, position } }));
        }),
        switchMap(({ taskId, listId, position }) =>
          taskService.moveTask(taskId, { listId, position }).pipe(
            tapResponse({
              next: (task: Task) => {
                // Success: update with server state and clear pending
                patchState(store, updateEntity({ id: taskId, changes: task }));
                const pendingMoves = { ...store.pendingMoves() };
                delete pendingMoves[taskId];
                patchState(store, { pendingMoves });
              },
              error: (err: Error) => {
                // Rollback to original state
                const pendingMoves = store.pendingMoves();
                const original = pendingMoves[taskId];
                if (original) {
                  patchState(store, setEntity(original));
                }
                const updatedPending = { ...pendingMoves };
                delete updatedPending[taskId];
                patchState(store, { 
                  pendingMoves: updatedPending, 
                  error: err.message || 'Failed to move task' 
                });
              },
            })
          )
        )
      )
    ),

    deleteTask: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((id) =>
          taskService.deleteTask(id).pipe(
            tapResponse({
              next: () => {
                patchState(store, removeEntity(id), { isLoading: false });
              },
              error: (err: Error) => {
                patchState(store, { error: err.message || 'Failed to delete task', isLoading: false });
              },
            })
          )
        )
      )
    ),
  }))
);
