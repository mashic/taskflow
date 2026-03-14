import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.page').then(m => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage),
  },
];
