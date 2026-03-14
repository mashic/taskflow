# Phase 1: Foundation - Research

**Researched:** 2026-03-14
**Domain:** Angular 21 + NestJS monorepo with authentication
**Confidence:** HIGH

## Summary

This research covers the foundation phase requirements: pnpm monorepo setup, Angular 21 standalone application, NestJS API with Prisma/PostgreSQL, and JWT authentication with refresh token rotation.

Angular 21 is at v21.2.4 with standalone components as the default. Angular CLI now uses Vitest as the default testing framework. NestJS provides a mature authentication ecosystem via `@nestjs/passport` and `@nestjs/jwt` packages with well-documented patterns for JWT authentication.

**Primary recommendation:** Use Angular CLI and NestJS CLI for scaffolding, configure pnpm workspaces with the `workspace:*` protocol for local packages, implement JWT auth with separate access/refresh tokens following NestJS official patterns.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @angular/cli | 21.x | Angular scaffolding/build | Official Angular tooling |
| @angular/core | 21.2.4 | Angular framework | Current stable release |
| @nestjs/core | 11.x | NestJS framework | Latest stable version |
| @nestjs/jwt | 11.x | JWT token handling | Official NestJS JWT integration |
| @nestjs/passport | 11.x | Auth strategies | Official Passport integration |
| passport-jwt | 4.x | JWT strategy | Standard JWT extraction |
| passport-local | 1.x | Username/password auth | Standard local strategy |
| prisma | 6.x | Database ORM | Type-safe, schema-first |
| @prisma/client | 6.x | Database client | Auto-generated from schema |
| @ngrx/signals | 19.x | SignalStore state | Official NgRx signal-based state |
| pnpm | 10.x | Package manager | Workspace support, fast |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| bcrypt | 5.x | Password hashing | User registration/login |
| class-validator | 0.14.x | DTO validation | Request validation |
| class-transformer | 0.5.x | DTO transformation | Request/response transformation |
| @angular/material | 21.x | UI components | Optional, for Material Design |
| vitest | 3.x | Unit testing | Default for Angular 21 |
| @vitest/browser-playwright | 3.x | Browser testing | E2E-like component tests |
| playwright | 1.x | E2E testing | Full E2E tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Prisma | TypeORM | TypeORM has more features but worse DX, Prisma is schema-first |
| SignalStore | NgRx Store | Classic NgRx has more boilerplate, SignalStore is signal-native |
| bcrypt | argon2 | Argon2 is newer/more secure, bcrypt is more widely used |
| Vitest | Jest | Jest was Angular default before v21, Vitest is now standard |

**Installation:**
```bash
# Root workspace
pnpm add -D typescript vitest @types/node

# Angular app (apps/web)
ng new web --directory=apps/web --style=scss --routing=true --ssr=false
pnpm add @ngrx/signals

# NestJS API (apps/api)  
nest new api --directory=apps/api --package-manager=pnpm
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt passport-local bcrypt class-validator class-transformer
pnpm add -D @types/passport-jwt @types/passport-local @types/bcrypt prisma

# Shared types (packages/shared-types)
pnpm add -D typescript
```

## Architecture Patterns

### Recommended Project Structure

```
taskflow/
├── pnpm-workspace.yaml      # Workspace config
├── package.json             # Root package.json
├── apps/
│   ├── api/                 # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/        # Auth module
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   ├── local.strategy.ts
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   ├── guards/
│   │   │   │   │   ├── local-auth.guard.ts
│   │   │   │   │   └── jwt-auth.guard.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── users/       # Users module
│   │   │   ├── prisma/      # Prisma service
│   │   │   └── main.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   └── web/                 # Angular frontend
│       └── src/
│           ├── app/
│           │   ├── core/           # Singleton services
│           │   │   ├── auth/
│           │   │   │   ├── auth.service.ts
│           │   │   │   ├── auth.store.ts
│           │   │   │   ├── auth.guard.ts
│           │   │   │   └── auth.interceptor.ts
│           │   │   └── layout/
│           │   ├── features/       # Feature modules
│           │   └── shared/         # Shared components
│           └── main.ts
└── packages/
    └── shared-types/        # Shared TypeScript types
        └── src/
            └── index.ts
```

### Pattern 1: JWT Authentication Flow

**What:** Access token + Refresh token pattern for stateless auth
**When to use:** All API authentication
**Example:**
```typescript
// Source: NestJS official docs
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };
    return {
      access_token: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async refreshTokens(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);
    const user = await this.usersService.findById(payload.sub);
    return this.login(user);
  }
}
```

### Pattern 2: Angular Functional Guards

**What:** Route protection using functional guards (CanActivateFn)
**When to use:** Protecting authenticated routes
**Example:**
```typescript
// Source: Angular official docs
// auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthStore } from './auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  
  if (authStore.isAuthenticated()) {
    return true;
  }
  
  return router.createUrlTree(['/login']);
};
```

### Pattern 3: Angular Functional Interceptors

**What:** HTTP interceptor for adding JWT to requests
**When to use:** All authenticated API calls
**Example:**
```typescript
// Source: Angular official docs
// auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStore } from './auth.store';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.accessToken();
  
  if (token) {
    req = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
  }
  
  return next(req);
};
```

### Pattern 4: SignalStore for Auth State

**What:** NgRx SignalStore for authentication state management
**When to use:** Managing auth state across the app
**Example:**
```typescript
// Source: NgRx SignalStore docs
// auth.store.ts
import { computed, inject } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
};

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: false,
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ user }) => ({
    isAuthenticated: computed(() => !!user()),
  })),
  withMethods((store) => ({
    setAuth(user: User, accessToken: string, refreshToken: string) {
      patchState(store, { user, accessToken, refreshToken, isLoading: false });
    },
    clearAuth() {
      patchState(store, initialState);
    },
    setLoading(isLoading: boolean) {
      patchState(store, { isLoading });
    },
  }))
);
```

### Pattern 5: Prisma Schema for Auth

**What:** Database schema for user authentication
**When to use:** User data persistence
**Example:**
```prisma
// Source: Prisma docs
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  password     String
  name         String?
  refreshToken String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("users")
}
```

### Anti-Patterns to Avoid

- **Storing JWT in localStorage:** Use httpOnly cookies or memory for refresh tokens
- **No token refresh logic:** Always implement refresh token rotation
- **Synchronous password comparison:** Always use async bcrypt.compare()
- **Exposing password in responses:** Strip password from user objects
- **Not validating DTOs:** Always use class-validator on incoming requests
- **Constructor injection in Angular 21:** Use inject() function instead

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash | bcrypt | Timing attacks, salt handling |
| JWT token handling | Manual signing | @nestjs/jwt | Token validation, expiration |
| Auth strategies | Custom middleware | Passport.js | Battle-tested, extensible |
| Form validation | Manual checking | class-validator | Consistent, decorator-based |
| Reactive state | Custom signals | @ngrx/signals | Proper lifecycle, devtools |
| HTTP caching | Manual storage | Angular HttpClient | Built-in caching |
| Route guards | Custom checks | CanActivateFn | Framework integration |

**Key insight:** Authentication and security are where custom solutions create the most vulnerabilities. Use established libraries.

## Common Pitfalls

### Pitfall 1: Circular Dependencies in NestJS Modules

**What goes wrong:** AuthModule and UsersModule import each other
**Why it happens:** AuthService needs UsersService, UsersModule needs guards
**How to avoid:** Use forwardRef() or restructure to avoid circular imports
**Warning signs:** "Nest cannot create instance" errors at startup

### Pitfall 2: Missing CORS Configuration

**What goes wrong:** Frontend can't call API
**Why it happens:** NestJS CORS not enabled by default
**How to avoid:** Configure CORS in main.ts: `app.enableCors({ origin: 'http://localhost:4200' })`
**Warning signs:** "Access-Control-Allow-Origin" errors in browser console

### Pitfall 3: Prisma Client Not Generated

**What goes wrong:** TypeScript errors about missing Prisma types
**Why it happens:** Forgot to run `npx prisma generate` after schema changes
**How to avoid:** Add generate to postinstall script
**Warning signs:** "Cannot find module '@prisma/client'" errors

### Pitfall 4: Token Storage in Browser

**What goes wrong:** XSS vulnerabilities expose tokens
**Why it happens:** Storing tokens in localStorage
**How to avoid:** Use memory for access token, httpOnly cookie for refresh
**Warning signs:** Security audit findings

### Pitfall 5: Missing HttpClientModule

**What goes wrong:** NullInjector error for HttpClient
**Why it happens:** Angular 21 requires provideHttpClient() in bootstrap
**How to avoid:** Add `provideHttpClient(withInterceptors([authInterceptor]))` to app.config.ts
**Warning signs:** "No provider for HttpClient" errors

### Pitfall 6: Signal Reactivity Timing

**What goes wrong:** UI doesn't update when signals change
**Why it happens:** Reading signal once and storing value instead of keeping reactive
**How to avoid:** Always call signal getter in templates: `store.user()` not `user`
**Warning signs:** Stale data after state updates

## Code Examples

Verified patterns from official sources:

### Angular 21 Standalone Bootstrap

```typescript
// Source: Angular official docs
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { authInterceptor } from './app/core/auth/auth.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});
```

### NestJS Module with JWT

```typescript
// Source: NestJS official docs
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

### pnpm Workspace Configuration

```yaml
# Source: pnpm official docs
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### Shared Types Package

```json
// packages/shared-types/package.json
{
  "name": "@taskflow/shared-types",
  "version": "0.0.1",
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

```typescript
// packages/shared-types/src/index.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
```

### Vitest Test Configuration

```typescript
// Source: Angular official docs
// apps/web/src/test-providers.ts
import { Provider } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

const testProviders: Provider[] = [
  provideHttpClient(),
  provideHttpClientTesting(),
];

export default testProviders;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NgModules | Standalone components | Angular 15+ | No need for module declarations |
| @Input()/@Output() | input()/output() | Angular 17+ | Signal-based inputs |
| *ngIf/*ngFor | @if/@for/@switch | Angular 17+ | Built-in control flow |
| Jest | Vitest | Angular 21 | New default test runner |
| Constructor DI | inject() function | Angular 14+ | Functional approach |
| NgRx Store | NgRx SignalStore | NgRx 17+ | Signal-native state |
| Class guards | Functional guards | Angular 14+ | Simpler, tree-shakeable |
| Class interceptors | Functional interceptors | Angular 17+ | Simpler, tree-shakeable |

**Deprecated/outdated:**

- Karma test runner: Replaced by Vitest in Angular 21
- zone.js change detection: Optional/removable with signals
- NgModules: Still supported but standalone is recommended
- @Input()/@Output(): Still work but input()/output() preferred

## Open Questions

Things that couldn't be fully resolved:

1. **Refresh Token Storage Strategy**
   - What we know: Memory for access token is secure, httpOnly cookie for refresh is standard
   - What's unclear: Whether to use cookie or DB-stored token for refresh validation
   - Recommendation: Implement DB-stored refresh tokens with rotation for security

2. **Angular SSR/Hydration**
   - What we know: Angular 21 has improved hydration support
   - What's unclear: Whether to enable SSR for auth pages
   - Recommendation: Start without SSR (`--ssr=false`), add later if needed

## Sources

### Primary (HIGH confidence)

- Angular official docs (angular.dev) - v21.2.4 confirmed
- NestJS official docs (docs.nestjs.com) - Authentication chapter
- NgRx SignalStore docs (ngrx.io/guide/signals) - Full API coverage
- Prisma official docs (prisma.io/docs) - PostgreSQL setup
- pnpm official docs (pnpm.io) - Workspace configuration

### Secondary (MEDIUM confidence)

- Vitest documentation - Angular integration via @angular/build:unit-test

### Tertiary (LOW confidence)

- JWT refresh token rotation best practices - Multiple sources, patterns vary

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All from official documentation
- Architecture: HIGH - Official patterns from framework docs
- Pitfalls: HIGH - Well-documented common issues

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days - stable technologies)
