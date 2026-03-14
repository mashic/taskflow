import { Component, inject } from '@angular/core';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard">
      <h1>Welcome, {{ authStore.currentUser()?.name || authStore.currentUser()?.email }}</h1>
      <p>Your boards will appear here in Phase 2.</p>
    </div>
  `,
  styles: [`
    .dashboard h1 { margin-bottom: 1rem; }
    .dashboard p { color: #a0a0a0; }
  `]
})
export class DashboardPage {
  authStore = inject(AuthStore);
}
