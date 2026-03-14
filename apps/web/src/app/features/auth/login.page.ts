import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="auth-page">
      <h1>Login</h1>
      <p>Login form coming in plan 01-05</p>
      <a routerLink="/register">Create account</a>
    </div>
  `,
})
export class LoginPage {}
