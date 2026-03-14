import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Mock, vi } from 'vitest';
import { authGuard } from './auth.guard';
import { AuthStore } from './auth.store';

describe('authGuard', () => {
  let mockRouter: { createUrlTree: Mock };
  let authStore: InstanceType<typeof AuthStore>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    mockRouter = {
      createUrlTree: vi.fn(),
    };
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/dashboard' } as RouterStateSnapshot;

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
    });

    authStore = TestBed.inject(AuthStore);
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should redirect to login when user is not authenticated', () => {
    const loginUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(loginUrlTree);

    const result = TestBed.runInInjectionContext(() => 
      authGuard(mockRoute, mockState)
    );

    expect(result).toBe(loginUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should return true when user is authenticated', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    authStore.setAuth(mockUser, 'access-token', 'refresh-token');

    const result = TestBed.runInInjectionContext(() => 
      authGuard(mockRoute, mockState)
    );

    expect(result).toBe(true);
  });

  it('should redirect when only token exists without user', () => {
    const loginUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(loginUrlTree);
    
    // Only set tokens, no user
    authStore.setTokens('access-token', 'refresh-token');

    const result = TestBed.runInInjectionContext(() => 
      authGuard(mockRoute, mockState)
    );

    expect(result).toBe(loginUrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('should redirect after user logs out', () => {
    const mockUser = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const loginUrlTree = {} as UrlTree;
    mockRouter.createUrlTree.mockReturnValue(loginUrlTree);

    // First authenticate
    authStore.setAuth(mockUser, 'access-token', 'refresh-token');
    
    // Then clear auth (logout)
    authStore.clearAuth();

    const result = TestBed.runInInjectionContext(() => 
      authGuard(mockRoute, mockState)
    );

    expect(result).toBe(loginUrlTree);
  });
});
