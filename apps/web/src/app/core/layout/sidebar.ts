import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <nav>
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <!-- Future: Boards list will go here -->
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background: #16213e;
      height: calc(100vh - 60px);
      padding: 1rem;
    }
    nav a {
      display: block;
      color: #a0a0a0;
      text-decoration: none;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }
    nav a:hover { background: rgba(255,255,255,0.05); color: white; }
    nav a.active { background: #0f3460; color: white; }
  `]
})
export class SidebarComponent {}
