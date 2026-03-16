import { computed, inject } from '@angular/core';
import {
    patchState,
    signalStore,
    withComputed,
    withMethods,
    withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { Activity } from '@taskflow/shared-types';
import { pipe, switchMap, tap } from 'rxjs';
import { ActivityService } from './activity.service';

interface ActivityState {
  activities: Activity[];
  selectedBoardId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ActivityState = {
  activities: [],
  selectedBoardId: null,
  isLoading: false,
  error: null,
};

export const ActivityStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ activities }) => ({
    /**
     * Activities sorted by createdAt descending (most recent first)
     */
    recentActivities: computed(() =>
      [...activities()].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    ),
    activityCount: computed(() => activities().length),
  })),
  withMethods((store, activityService = inject(ActivityService)) => ({
    /**
     * Load activities for a board using rxMethod
     */
    loadActivities: rxMethod<string>(
      pipe(
        tap((boardId) =>
          patchState(store, {
            selectedBoardId: boardId,
            isLoading: true,
            error: null,
          }),
        ),
        switchMap((boardId) =>
          activityService.getActivitiesByBoard(boardId).pipe(
            tap({
              next: (activities) =>
                patchState(store, { activities, isLoading: false }),
              error: (error: Error) =>
                patchState(store, {
                  error: error.message,
                  isLoading: false,
                }),
            }),
          ),
        ),
      ),
    ),

    /**
     * Add a new activity (for WebSocket real-time updates)
     */
    addActivity(activity: Activity) {
      patchState(store, {
        activities: [activity, ...store.activities()],
      });
    },

    /**
     * Clear activities when leaving board
     */
    clearActivities() {
      patchState(store, initialState);
    },
  })),
);
