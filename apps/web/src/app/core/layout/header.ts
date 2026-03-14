import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="header">
      <div class="header-left">
        <a routerLink="/dashboard" class="logo">TaskFlow</a>
      </div>
      
      <div class="header-right">
        @if (authStore.currentUser(); as user) {
          <span class="user-name">{{ user.name || user.email }}</span>
        }
        <button class="logout-btn" (click)="onLogout()">Logout</button>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #1a1a2e;
      color: white;
      height: 60px;
    }
    .logo { color: white; text-decoration: none; font-size: 1.5rem; font-weight: bold; }
    .header-right { display: flex; align-items: center; gap: 1rem; }
    .user-name { color: #a0a0a0; }
    .logout-btn { 
      background: transparent; 
      border: 1px solid #fff; 
      color: white; 
      padding: 0.5rem 1rem; 
      cursor: pointer;
      border-radius: 4px;
    }
    .logout-btn:hover { background: rgba(255,255,255,0.1); }
  `]
})
export class HeaderComponent {
  authStore = inject(AuthStore);
  private authService = inject(AuthService);
  
  onLogout() {
    this.authService.logout();
  }
}
