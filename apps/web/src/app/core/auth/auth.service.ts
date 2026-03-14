import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { AuthResponse, LoginRequest, RegisterRequest } from '@taskflow/shared-types';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authStore = inject(AuthStore);
  
  private apiUrl = environment.apiUrl;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.authStore.setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        this.authStore.setError(error.error?.message || 'Login failed');
        return throwError(() => error);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this.authStore.setLoading(true);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        this.authStore.setAuth(response.user, response.tokens.accessToken, response.tokens.refreshToken);
        this.router.navigate(['/dashboard']);
      }),
      catchError(error => {
        this.authStore.setError(error.error?.message || 'Registration failed');
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      complete: () => {
        this.authStore.clearAuth();
        this.router.navigate(['/login']);
      },
      error: () => {
        this.authStore.clearAuth();
        this.router.navigate(['/login']);
      }
    });
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap(response => {
        this.authStore.setTokens(response.tokens.accessToken, response.tokens.refreshToken);
      })
    );
  }
}
