# Roadmap: TaskFlow

## Overview

TaskFlow is built in 4 phases: Foundation (monorepo + auth), Core Features (boards + tasks + real-time), Advanced Features (comments + search + teams), and Polish (performance + testing + DevOps). Each phase builds on the previous, with TDD driving development.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Monorepo setup, auth module, core UI shell (completed 2026-03-14)
- [ ] **Phase 2: Core Features** - Boards, lists, tasks, real-time sync ← Next
- [ ] **Phase 3: Advanced Features** - Comments, activity, search, team management
- [ ] **Phase 4: Polish** - Performance, testing coverage, DevOps

## Phase Details

### Phase 1: Foundation

**Goal**: Working monorepo with authentication and basic UI shell
**Depends on**: Nothing (first phase)
**Requirements**: REQ-01, REQ-02
**Success Criteria** (what must be TRUE):
1. `pnpm install` works from root, all workspaces resolve
2. User can register, login, and see protected dashboard
3. Auth guard redirects unauthenticated users to login
4. Token interceptor attaches JWT to API requests
5. All auth tests pass (both frontend and backend)

**Plans**: 6 plans

Plans:
- [x] 01-01: Initialize pnpm monorepo structure (workspace.yaml, folder structure)
- [x] 01-02: Create NestJS API app with Prisma + PostgreSQL setup
- [x] 01-03: Implement backend auth (register, login, refresh token rotation)
- [x] 01-04: Create Angular 21 web app with standalone components
- [x] 01-05: Implement frontend auth (AuthService, guards, interceptors)
- [x] 01-06: Create core UI shell (layout, theme, toast notifications)

### Phase 2: Core Features

**Goal**: Functional Kanban board with real-time collaboration
**Depends on**: Phase 1
**Requirements**: REQ-03, REQ-04, REQ-05, REQ-06
**Success Criteria** (what must be TRUE):
1. User can create, view, edit, delete boards
2. User can add lists to boards and reorder them
3. User can create tasks and drag-drop between lists
4. Changes sync in real-time across browser tabs
5. SignalStore manages all board/task state
6. Optimistic updates work with server reconciliation

**Plans**: 8 plans

Plans:
- [x] 02-01: Backend board CRUD with repository pattern
- [x] 02-02: Frontend BoardStore with SignalStore
- [x] 02-03: Board list page and board creation
- [x] 02-04: Backend list/task CRUD with position ordering
- [x] 02-05: Frontend TaskStore with Entity Adapter
- [x] 02-06: Kanban board view with drag-drop (CDK)
- [x] 02-07: WebSocket gateway and real-time events
- [x] 02-08: Frontend WebSocket integration with SignalStore

### Phase 3: Advanced Features

**Goal**: Rich collaboration features (comments, activity, search, teams)
**Depends on**: Phase 2
**Requirements**: REQ-09 (patterns)
**Success Criteria** (what must be TRUE):
1. Users can comment on tasks with @mentions
2. Activity feed shows all changes with timestamps
3. Search finds tasks by title/description across boards
4. Board owners can invite members and assign roles
5. Each feature demonstrates at least one design pattern

**Plans**: 6 plans

Plans:
- [ ] 03-01: Comments backend + frontend with Strategy pattern (notifications)
- [ ] 03-02: Activity log with Decorator pattern (audit logging)
- [ ] 03-03: Full-text search with Builder pattern (query building)
- [ ] 03-04: Team invitations with Factory pattern
- [ ] 03-05: Role-based permissions with Strategy pattern
- [ ] 03-06: BoardFacade with Facade pattern (wrapping stores)

### Phase 4: Polish

**Goal**: Production-ready quality with comprehensive testing and deployment
**Depends on**: Phase 3
**Requirements**: REQ-07, REQ-08
**Success Criteria** (what must be TRUE):
1. Unit test coverage > 80% for services/stores
2. E2E tests pass for all critical paths
3. Lighthouse score > 90 for performance
4. GitHub Actions CI/CD pipeline deploys successfully
5. Documentation complete for interview preparation

**Plans**: 4 plans

Plans:
- [ ] 04-01: Vitest unit test coverage push (services, stores, components)
- [ ] 04-02: Playwright E2E tests for critical flows
- [ ] 04-03: Performance optimization (lazy loading, virtual scroll, bundle analysis)
- [ ] 04-04: GitHub Actions CI/CD + Docker + deployment

## Milestone Summaries

(Populated after each phase completion)
