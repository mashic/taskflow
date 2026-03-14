import { TestBed } from '@angular/core/testing';
import { AuthStore } from './auth.store';

describe('AuthStore', () => {
  let authStore: InstanceType<typeof AuthStore>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    authStore = TestBed.inject(AuthStore);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should have null user initially', () => {
      expect(authStore.user()).toBeNull();
    });

    it('should have null accessToken initially', () => {
      expect(authStore.accessToken()).toBeNull();
    });

    it('should have null refreshToken initially', () => {
      expect(authStore.refreshToken()).toBeNull();
    });

    it('should not be loading initially', () => {
      expect(authStore.isLoading()).toBeFalse();
    });

    it('should have no error initially', () => {
      expect(authStore.error()).toBeNull();
    });

    it('should not be authenticated initially', () => {
      expect(authStore.isAuthenticated()).toBeFalse();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      authStore.setLoading(true);
      expect(authStore.isLoading()).toBeTrue();
    });

    it('should clear error when setting loading', () => {
      authStore.setError('some error');
      authStore.setLoading(true);
      expect(authStore.error()).toBeNull();
    });
  });

  describe('setAuth', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should set user and tokens', () => {
      authStore.setAuth(mockUser, 'access-token', 'refresh-token');
      
      expect(authStore.user()).toEqual(mockUser);
      expect(authStore.accessToken()).toBe('access-token');
      expect(authStore.refreshToken()).toBe('refresh-token');
    });

    it('should set isAuthenticated to true', () => {
      authStore.setAuth(mockUser, 'access-token', 'refresh-token');
      expect(authStore.isAuthenticated()).toBeTrue();
    });

    it('should store tokens in localStorage', () => {
      authStore.setAuth(mockUser, 'access-token', 'refresh-token');
      
      expect(localStorage.getItem('accessToken')).toBe('access-token');
      expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
    });

    it('should set loading to false', () => {
      authStore.setLoading(true);
      authStore.setAuth(mockUser, 'access-token', 'refresh-token');
      expect(authStore.isLoading()).toBeFalse();
    });

    it('should clear error', () => {
      authStore.setError('some error');
      authStore.setAuth(mockUser, 'access-token', 'refresh-token');
      expect(authStore.error()).toBeNull();
    });
  });

  describe('setTokens', () => {
    it('should update tokens only', () => {
      authStore.setTokens('new-access', 'new-refresh');
      
      expect(authStore.accessToken()).toBe('new-access');
      expect(authStore.refreshToken()).toBe('new-refresh');
    });

    it('should update localStorage', () => {
      authStore.setTokens('new-access', 'new-refresh');
      
      expect(localStorage.getItem('accessToken')).toBe('new-access');
      expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      authStore.setError('Login failed');
      expect(authStore.error()).toBe('Login failed');
    });

    it('should set loading to false', () => {
      authStore.setLoading(true);
      authStore.setError('Login failed');
      expect(authStore.isLoading()).toBeFalse();
    });
  });

  describe('clearAuth', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      authStore.setAuth(mockUser, 'access-token', 'refresh-token');
    });

    it('should clear user', () => {
      authStore.clearAuth();
      expect(authStore.user()).toBeNull();
    });

    it('should clear tokens', () => {
      authStore.clearAuth();
      expect(authStore.accessToken()).toBeNull();
      expect(authStore.refreshToken()).toBeNull();
    });

    it('should set isAuthenticated to false', () => {
      authStore.clearAuth();
      expect(authStore.isAuthenticated()).toBeFalse();
    });

    it('should remove tokens from localStorage', () => {
      authStore.clearAuth();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });
  });

  describe('initFromStorage', () => {
    it('should load tokens from localStorage', () => {
      localStorage.setItem('accessToken', 'stored-access');
      localStorage.setItem('refreshToken', 'stored-refresh');
      
      authStore.initFromStorage();
      
      expect(authStore.accessToken()).toBe('stored-access');
      expect(authStore.refreshToken()).toBe('stored-refresh');
    });

    it('should not update state if localStorage is empty', () => {
      authStore.initFromStorage();
      
      expect(authStore.accessToken()).toBeNull();
      expect(authStore.refreshToken()).toBeNull();
    });

    it('should not update if only accessToken exists', () => {
      localStorage.setItem('accessToken', 'stored-access');
      
      authStore.initFromStorage();
      
      expect(authStore.accessToken()).toBeNull();
    });
  });

  describe('computed: isAuthenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return false when user is null', () => {
      authStore.setTokens('token', 'refresh');
      expect(authStore.isAuthenticated()).toBeFalse();
    });

    it('should return false when accessToken is null', () => {
      // Can't set user without token via setAuth, so this tests initial state
      expect(authStore.isAuthenticated()).toBeFalse();
    });

    it('should return true when both user and accessToken exist', () => {
      authStore.setAuth(mockUser, 'token', 'refresh');
      expect(authStore.isAuthenticated()).toBeTrue();
    });
  });

  describe('computed: currentUser', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return null when not authenticated', () => {
      expect(authStore.currentUser()).toBeNull();
    });

    it('should return user when authenticated', () => {
      authStore.setAuth(mockUser, 'token', 'refresh');
      expect(authStore.currentUser()).toEqual(mockUser);
    });
  });
});
