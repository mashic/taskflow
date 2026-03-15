import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { AuthStore } from '../auth/auth.store';
import { SearchResultsComponent } from '../../features/search/search-results';
import { SearchStore } from '../../features/search/search.store';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, SearchResultsComponent],
  template: `
    <header class="header">
      <div class="header-left">
        <a routerLink="/dashboard" class="logo">TaskFlow</a>
      </div>
      
      <div class="header-center">
        <div class="search-container" #searchContainer>
          <input
            type="text"
            class="search-input"
            placeholder="Search tasks..."
            [value]="searchStore.query()"
            (input)="onSearchInput($event)"
            (focus)="showResults.set(true)"
          />
          @if (showResults() && searchStore.isActive()) {
            <div class="search-dropdown">
              <app-search-results (resultSelected)="onResultSelected()" />
            </div>
          }
        </div>
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
    .header-center { flex: 1; display: flex; justify-content: center; max-width: 400px; margin: 0 2rem; }
    .search-container { position: relative; width: 100%; }
    .search-input {
      width: 100%;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      font-size: 0.9rem;
      outline: none;
      transition: background 0.2s;
    }
    .search-input::placeholder { color: rgba(255, 255, 255, 0.5); }
    .search-input:focus { background: rgba(255, 255, 255, 0.2); }
    .search-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 0.5rem;
      z-index: 100;
    }
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
  searchStore = inject(SearchStore);
  private authService = inject(AuthService);
  
  searchContainer = viewChild<ElementRef>('searchContainer');
  showResults = signal(false);
  
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const container = this.searchContainer();
    if (container && !container.nativeElement.contains(event.target)) {
      this.showResults.set(false);
    }
  }
  
  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchStore.search(input.value);
    this.showResults.set(true);
  }
  
  onResultSelected(): void {
    this.showResults.set(false);
  }
  
  onLogout() {
    this.authService.logout();
  }
}
