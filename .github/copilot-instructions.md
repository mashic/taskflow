# TaskFlow Copilot Instructions

## Project Context

TaskFlow is a real-time Kanban collaboration platform (Angular 21 + NestJS monorepo).

## Stack

- **Frontend**: Angular 21 (standalone components, signals, SignalStore)
- **Backend**: NestJS + Prisma + PostgreSQL
- **Testing**: Vitest (unit), Playwright (E2E)
- **Package Manager**: pnpm with workspaces

## Coding Standards

### Angular 21

- Use **standalone components only** (no NgModules)
- Use **signals** (`signal()`, `computed()`, `effect()`) for reactive state
- Use **`input()`/`output()`** instead of `@Input()`/`@Output()`
- Use **`inject()`** function instead of constructor injection
- Use **`@if`, `@for`, `@switch`** control flow (not `*ngIf`, `*ngFor`)
- Use **functional guards** (`CanActivateFn`) and **functional interceptors** (`HttpInterceptorFn`)
- Use **`takeUntilDestroyed()`** for RxJS subscription cleanup
- Use **SignalStore** for state management (not classic NgRx Store)

### NestJS

- Follow **Repository pattern** for data access
- Use **Prisma** for database operations
- Use **class-validator** for DTO validation
- Use **Passport.js** with JWT strategy for auth

### Testing (TDD)

- Write tests BEFORE implementation
- Unit tests: Vitest with TestBed
- E2E tests: Playwright
- Target: 80%+ coverage

### Git

- Atomic commits per feature/fix
- Conventional commits: `feat:`, `fix:`, `test:`, `docs:`, `refactor:`
- Branch naming: `feature/`, `fix/`, `test/`

## File Naming

- Angular: `feature-name.ts` (not `feature-name.component.ts`)
- Services: `*.service.ts`
- Stores: `*.store.ts`
- Guards: `*.guard.ts`
- Interceptors: `*.interceptor.ts`

## Important Paths

- GSD context: `.gsd/PROJECT.md`, `.gsd/STATE.md`, `.gsd/ROADMAP.md`
- Shared types: `packages/shared-types/src/index.ts`
- Angular app: `apps/web/`
- NestJS API: `apps/api/`

## GSD Workflow

Before starting work, check:
1. `.gsd/STATE.md` — Current phase and progress
2. `.gsd/ROADMAP.md` — Plan details
3. `.gsd/PROJECT.md` — Requirements and decisions
