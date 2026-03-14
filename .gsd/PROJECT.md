# TaskFlow

## What This Is

TaskFlow is a real-time Kanban collaboration platform (Trello/Linear style) built as a portfolio project to demonstrate Angular 21+ with NestJS in a pnpm monorepo. It showcases modern design patterns, TDD practices, and features that align with high-demand job requirements (CloudTalk, Trinetix, etc.).

## Core Value

**Demonstrate production-ready full-stack skills with modern Angular 21 and NestJS in a way that directly maps to interview talking points and job requirements.**

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] REQ-01: Monorepo setup with pnpm workspaces (Angular 21 + NestJS + shared types)
- [ ] REQ-02: JWT authentication with refresh token rotation
- [ ] REQ-03: Kanban boards with CRUD operations
- [ ] REQ-04: Tasks with drag-and-drop between lists
- [ ] REQ-05: Real-time sync via WebSocket (Socket.io)
- [ ] REQ-06: SignalStore state management with Entity Adapter
- [ ] REQ-07: TDD with Vitest (unit) + Playwright (E2E), 80%+ coverage
- [ ] REQ-08: CI/CD with GitHub Actions
- [ ] REQ-09: 12+ design patterns documented with interview talking points

### Out of Scope

- Mobile app — Web-first, PWA consideration later
- Payment/billing — Not needed for portfolio demonstration
- Multi-tenant SaaS — Single organization model for simplicity
- Email delivery — Mock notifications, no real email service

## Context

### Technical Stack
- **Frontend:** Angular 21 (signals, standalone components, zoneless-ready)
- **Backend:** NestJS + Prisma + PostgreSQL
- **State:** NgRx SignalStore with Entity Adapter
- **Real-time:** Socket.io via @nestjs/websockets
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions

### Target Jobs
- CloudTalk: Angular + Node.js + NestJS + Kubernetes + AWS
- Trinetix: .NET C# (alternate stack, but shows full-stack capability)

### Angular 21 Features to Demonstrate
- signal(), computed(), effect()
- input(), output(), model()
- @if, @for, @switch control flow
- inject() function
- Functional guards and interceptors
- toSignal(), toObservable(), takeUntilDestroyed()
- resource() for async data loading
- Standalone components only

### Design Patterns to Demonstrate
1. Repository — Data access abstraction
2. Factory — User/invitation creation
3. Strategy — Notifications, conflict resolution
4. Observer — SignalStore + WebSocket
5. Decorator — Logging interceptor, caching
6. Facade — BoardFacade wrapping stores
7. Adapter — API response transform
8. Command — Store actions
9. Builder — Form builder, query builder
10. Template Method — Base service
11. Singleton — providedIn: 'root'
12. Proxy — Virtual scroll, lazy loading

## Key Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-14 | pnpm monorepo | Faster installs, better disk usage, workspace support |
| 2026-03-14 | PostgreSQL over MySQL | Better for future features (full-text search, JSON) |
| 2026-03-14 | SignalStore over classic NgRx | Signal-native, less boilerplate |
| 2026-03-14 | Prisma over TypeORM | Better DX, type safety, schema-first |
| 2026-03-14 | Vitest over Jest | Native browser mode, faster, Angular 21 default |
