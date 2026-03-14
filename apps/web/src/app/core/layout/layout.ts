import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header';
import { SidebarComponent } from './sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="layout">
      <app-header />
      <div class="layout-body">
        <app-sidebar />
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .layout { min-height: 100vh; display: flex; flex-direction: column; }
    .layout-body { display: flex; flex: 1; }
    .main-content { flex: 1; padding: 2rem; background: #0f0f23; color: white; }
  `]
})
export class LayoutComponent {}
