# Requirements: TaskFlow

## Requirement Index

| ID | Title | Phase | Status | Priority |
|----|-------|-------|--------|----------|
| REQ-01 | Monorepo Setup | 1 | 🔲 Not Started | P0 |
| REQ-02 | Authentication | 1 | 🔲 Not Started | P0 |
| REQ-03 | Boards CRUD | 2 | 🔲 Not Started | P0 |
| REQ-04 | Tasks Drag-Drop | 2 | 🔲 Not Started | P0 |
| REQ-05 | Real-time Sync | 2 | 🔲 Not Started | P1 |
| REQ-06 | SignalStore State | 2 | 🔲 Not Started | P0 |
| REQ-07 | Test Coverage 80%+ | 4 | 🔲 Not Started | P1 |
| REQ-08 | CI/CD Pipeline | 4 | 🔲 Not Started | P1 |
| REQ-09 | Design Patterns | 3 | 🔲 Not Started | P1 |

## Detailed Requirements

### REQ-01: Monorepo Setup

**Description:** pnpm monorepo with Angular 21 frontend, NestJS backend, and shared packages

**Acceptance Criteria:**
- [ ] `pnpm-workspace.yaml` defines apps/* and packages/* workspaces
- [ ] `apps/web` contains Angular 21 standalone app
- [ ] `apps/api` contains NestJS app with Prisma
- [ ] `packages/shared-types` contains TypeScript interfaces
- [ ] `packages/eslint-config` contains shared ESLint rules
- [ ] Root scripts work: `pnpm dev`, `pnpm test`, `pnpm build`
- [ ] Husky + lint-staged set up for pre-commit hooks

**Tech Stack:**
- pnpm 9+
- Angular 21 (standalone, signals, zoneless-ready)
- NestJS 10+
- Prisma 5+
- TypeScript 5.4+

---

### REQ-02: Authentication

**Description:** JWT authentication with refresh token rotation

**Acceptance Criteria:**
- [ ] User can register with email/password
- [ ] User can login and receive access + refresh tokens
- [ ] Access token expires in 15 minutes
- [ ] Refresh token rotation: new refresh token on each refresh
- [ ] Frontend stores tokens securely (httpOnly cookies or secure storage)
- [ ] Auth guard protects routes, redirects to login
- [ ] Token interceptor attaches Bearer token to API requests
- [ ] 401 response triggers token refresh or logout

**Security:**
- Passwords hashed with bcrypt (12 rounds)
- Refresh tokens stored in database (revocable)
- CORS configured for frontend origin only

---

### REQ-03: Boards CRUD

**Description:** Create, read, update, delete Kanban boards

**Acceptance Criteria:**
- [ ] User can create a board with title and optional description
- [ ] User sees list of their boards on dashboard
- [ ] User can rename board
- [ ] User can delete board (soft delete)
- [ ] Each board belongs to exactly one owner (initially)
- [ ] Board routes are protected by auth guard

**Data Model:**
```typescript
interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
```

---

### REQ-04: Tasks Drag-Drop

**Description:** Create tasks in lists, drag-drop between lists

**Acceptance Criteria:**
- [ ] User can create task with title in any list
- [ ] User can edit task title, description, due date
- [ ] User can drag task within same list (reorder)
- [ ] User can drag task to different list (move)
- [ ] Position is maintained after page reload
- [ ] Optimistic UI updates immediately, reconciles with server

**Data Model:**
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
  assigneeId?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

---

### REQ-05: Real-time Sync

**Description:** WebSocket sync for multi-user collaboration

**Acceptance Criteria:**
- [ ] WebSocket connects after authentication
- [ ] User joins board-specific room
- [ ] Task create/update/delete broadcasts to room
- [ ] Other connected users see changes instantly
- [ ] Connection handles reconnect on network issues
- [ ] Optimistic updates reconcile with server events

**Events:**
- `task.created`, `task.updated`, `task.deleted`, `task.moved`
- `list.created`, `list.updated`, `list.deleted`, `list.reordered`
- `board.updated`, `member.joined`, `member.left`

---

### REQ-06: SignalStore State Management

**Description:** NgRx SignalStore with Entity Adapter for normalized state

**Acceptance Criteria:**
- [ ] BoardStore manages boards with entities
- [ ] TaskStore manages tasks with entities, filtered by board
- [ ] Computed selectors for filtered/derived state
- [ ] rxMethod for async operations
- [ ] Loading/error states tracked
- [ ] DevTools integration works

---

### REQ-07: Test Coverage 80%+

**Description:** Comprehensive test coverage with Vitest and Playwright

**Acceptance Criteria:**
- [ ] Services: 90% coverage
- [ ] Stores: 90% coverage
- [ ] Components: 80% coverage
- [ ] E2E: Auth flow, board CRUD, task drag-drop
- [ ] CI fails if coverage drops below threshold

---

### REQ-08: CI/CD Pipeline

**Description:** GitHub Actions for lint, test, build, deploy

**Acceptance Criteria:**
- [ ] Lint runs on every PR
- [ ] Tests run on every PR
- [ ] Build succeeds for both apps
- [ ] Deploy preview for PRs (optional)
- [ ] Deploy to production on main merge

---

### REQ-09: Design Patterns

**Description:** Document 12+ design patterns with interview talking points

**Patterns:**
1. Repository — `*.repository.ts`
2. Factory — `*.factory.ts`
3. Strategy — `*.strategy.ts`
4. Observer — SignalStore + WebSocket
5. Decorator — Interceptors
6. Facade — `*.facade.ts`
7. Adapter — DTOs
8. Command — Store methods
9. Builder — Query/form builders
10. Template Method — Base services
11. Singleton — `providedIn: 'root'`
12. Proxy — Virtual scroll

Each pattern should have:
- File location
- Code example
- Interview talking point (1-2 sentences)
