import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthStore } from '../../core/auth/auth.store';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="auth-container">
      <h1>Register</h1>
      
      @if (authStore.error()) {
        <div class="error">{{ authStore.error() }}</div>
      }
      
      <form (ngSubmit)="onSubmit()">
        <div class="form-group">
          <label for="name">Name (optional)</label>
          <input type="text" id="name" [(ngModel)]="name" name="name" />
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" [(ngModel)]="email" name="email" required />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" [(ngModel)]="password" name="password" required minlength="8" />
        </div>
        
        <button type="submit" [disabled]="authStore.isLoading()">
          @if (authStore.isLoading()) { Creating account... } @else { Register }
        </button>
      </form>
      
      <p>Already have an account? <a routerLink="/login">Login</a></p>
    </div>
  `,
  styles: [`
    .auth-container { max-width: 400px; margin: 100px auto; padding: 2rem; }
    .form-group { margin-bottom: 1rem; }
    label { display: block; margin-bottom: 0.5rem; }
    input { width: 100%; padding: 0.5rem; }
    button { width: 100%; padding: 1rem; margin-top: 1rem; }
    .error { color: red; margin-bottom: 1rem; }
  `]
})
export class RegisterPage {
  authStore = inject(AuthStore);
  private authService = inject(AuthService);
  
  name = '';
  email = '';
  password = '';
  
  onSubmit() {
    this.authService.register({ 
      email: this.email, 
      password: this.password,
      name: this.name || undefined 
    }).subscribe();
  }
}
