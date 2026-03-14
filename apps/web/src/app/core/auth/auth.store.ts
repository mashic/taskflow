import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { User, AuthTokens } from '@taskflow/shared-types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
  error: null,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user, accessToken }) => ({
    isAuthenticated: computed(() => !!user() && !!accessToken()),
    currentUser: computed(() => user()),
  })),
  withMethods((store) => ({
    setLoading(isLoading: boolean) {
      patchState(store, { isLoading, error: null });
    },
    setAuth(user: User, accessToken: string, refreshToken: string) {
      patchState(store, { user, accessToken, refreshToken, isLoading: false, error: null });
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    setTokens(accessToken: string, refreshToken: string) {
      patchState(store, { accessToken, refreshToken });
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    },
    setError(error: string) {
      patchState(store, { error, isLoading: false });
    },
    clearAuth() {
      patchState(store, initialState);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    },
    initFromStorage() {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken && refreshToken) {
        patchState(store, { accessToken, refreshToken });
      }
    },
  }))
);
