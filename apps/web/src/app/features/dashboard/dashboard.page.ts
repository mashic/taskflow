import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div class="dashboard-page">
      <h1>Dashboard</h1>
      <p>Protected dashboard - will require auth in plan 01-05</p>
    </div>
  `,
})
export class DashboardPage {}
