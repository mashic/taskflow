# Phase 3: Advanced Features - Research

**Researched:** March 15, 2026
**Domain:** Collaboration features (comments, activity, search, teams) with design patterns
**Confidence:** HIGH

## Summary

Phase 3 implements rich collaboration features for TaskFlow: comments with @mentions, activity feeds, full-text search, team invitations, and role-based permissions. Each feature demonstrates a specific design pattern as required by REQ-09 (12+ patterns documented).

The research covers:
- Prisma schema design for new models (Comment, Activity, TeamMember, Invitation)
- PostgreSQL full-text search using `to_tsvector`/`to_tsquery` via Prisma raw queries
- Strategy pattern for notification channels (in-app, email mock, WebSocket)
- Decorator pattern for audit logging (wrapping service methods)
- Factory pattern for invitation creation (email vs link invitations)
- Facade pattern for BoardFacade wrapping multiple SignalStores

**Primary recommendation:** Implement each feature as a separate module with clear design pattern documentation. Use Prisma's existing schema patterns and extend with new models. Leverage PostgreSQL's native full-text search capabilities through `$queryRaw` for optimal performance.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 5.x | ORM with raw SQL support | Already in use, supports `$queryRaw` for full-text search |
| @nestjs/websockets | 10.x | Real-time notifications | Already configured with EventsGateway |
| @ngrx/signals | 19.x | SignalStore for state | Already in use for BoardStore, ListStore, TaskStore |
| class-validator | 0.14.x | DTO validation | Already configured |
| class-transformer | 0.5.x | Object transformation | Already configured |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @ngrx/signals/entities | 19.x | Entity management | Already used for board/list/task entities |
| rxjs | 7.x | Reactive patterns | For rxMethod in SignalStore |
| @ngrx/operators | 19.x | tapResponse helper | For rxMethod error handling |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL full-text | Elasticsearch | Overkill for this scale, PostgreSQL is sufficient |
| Prisma $queryRaw | Prisma native search | Native doesn't support tsvector/tsquery ranking |
| Class-based patterns | Function composition | Class-based aligns with NestJS conventions |

**Installation:**
No new packages required - all packages already installed.

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/
├── comments/                    # 03-01: Strategy Pattern (notifications)
│   ├── comments.module.ts
│   ├── comments.controller.ts
│   ├── comments.service.ts
│   ├── comments.repository.ts
│   ├── dto/
│   │   ├── create-comment.dto.ts
│   │   └── update-comment.dto.ts
│   └── strategies/
│       ├── notification.strategy.ts      # Interface
│       ├── in-app-notification.strategy.ts
│       ├── email-notification.strategy.ts
│       └── websocket-notification.strategy.ts
├── activity/                    # 03-02: Decorator Pattern
│   ├── activity.module.ts
│   ├── activity.service.ts
│   ├── activity.repository.ts
│   └── decorators/
│       └── audit-log.decorator.ts        # Method decorator for logging
├── search/                      # 03-03: Builder Pattern
│   ├── search.module.ts
│   ├── search.controller.ts
│   ├── search.service.ts
│   └── builders/
│       └── search-query.builder.ts       # PostgreSQL FTS query builder
├── invitations/                 # 03-04: Factory Pattern
│   ├── invitations.module.ts
│   ├── invitations.controller.ts
│   ├── invitations.service.ts
│   ├── invitations.repository.ts
│   └── factories/
│       └── invitation.factory.ts
├── permissions/                 # 03-05: Strategy Pattern (RBAC)
│   ├── permissions.module.ts
│   ├── permissions.service.ts
│   ├── permissions.guard.ts
│   └── strategies/
│       ├── permission.strategy.ts        # Interface
│       ├── owner-permission.strategy.ts
│       ├── admin-permission.strategy.ts
│       └── member-permission.strategy.ts
└── teams/                       # Team member management
    ├── teams.module.ts
    ├── teams.controller.ts
    ├── teams.service.ts
    └── teams.repository.ts

apps/web/src/app/features/
├── comments/
│   ├── comment.service.ts
│   ├── comment.store.ts
│   └── components/
│       ├── comment-list.ts
│       └── comment-input.ts
├── activity/
│   ├── activity.service.ts
│   ├── activity.store.ts
│   └── activity-feed.ts
├── search/
│   ├── search.service.ts
│   ├── search.store.ts
│   └── search-results.ts
├── teams/
│   ├── team.service.ts
│   ├── team.store.ts
│   └── components/
│       ├── team-members.ts
│       └── invite-dialog.ts
└── kanban/
    └── board.facade.ts          # 03-06: Facade Pattern
```

### Pattern 1: Strategy Pattern (Notifications)

**What:** Encapsulate notification algorithms (in-app, email, WebSocket) behind a common interface.
**When to use:** When you need multiple interchangeable algorithms that perform similar actions.
**Example:**
```typescript
// Source: Gang of Four pattern adapted for NestJS

// notification.strategy.ts - Interface
export interface NotificationStrategy {
  send(userId: string, notification: NotificationPayload): Promise<void>;
}

// in-app-notification.strategy.ts
@Injectable()
export class InAppNotificationStrategy implements NotificationStrategy {
  constructor(private notificationRepo: NotificationRepository) {}

  async send(userId: string, payload: NotificationPayload): Promise<void> {
    await this.notificationRepo.create({
      userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      read: false,
    });
  }
}

// websocket-notification.strategy.ts
@Injectable()
export class WebSocketNotificationStrategy implements NotificationStrategy {
  constructor(private eventsGateway: EventsGateway) {}

  async send(userId: string, payload: NotificationPayload): Promise<void> {
    this.eventsGateway.sendToUser(userId, 'notification', payload);
  }
}

// email-notification.strategy.ts (mock)
@Injectable()
export class EmailNotificationStrategy implements NotificationStrategy {
  private readonly logger = new Logger(EmailNotificationStrategy.name);

  async send(userId: string, payload: NotificationPayload): Promise<void> {
    // Mock email - just log for demo
    this.logger.log(`[MOCK EMAIL] To: ${userId}, Subject: ${payload.title}`);
  }
}

// comments.service.ts - Context
@Injectable()
export class CommentsService {
  private notificationStrategies: NotificationStrategy[];

  constructor(
    @Inject('NOTIFICATION_STRATEGIES')
    strategies: NotificationStrategy[],
  ) {
    this.notificationStrategies = strategies;
  }

  async createComment(dto: CreateCommentDto, authorId: string): Promise<Comment> {
    const comment = await this.commentsRepo.create({ ...dto, authorId });
    
    // Notify all mentioned users using all strategies
    const mentionedUserIds = this.extractMentions(dto.content);
    for (const userId of mentionedUserIds) {
      for (const strategy of this.notificationStrategies) {
        await strategy.send(userId, {
          type: 'mention',
          title: 'You were mentioned',
          body: `${authorId} mentioned you in a comment`,
          taskId: dto.taskId,
        });
      }
    }
    
    return comment;
  }
}
```

### Pattern 2: Decorator Pattern (Audit Logging)

**What:** Wrap service methods to add audit logging without modifying the original method.
**When to use:** Adding cross-cutting concerns (logging, timing, caching) to existing methods.
**Example:**
```typescript
// Source: NestJS custom decorators + TypeScript decorators

// audit-log.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const AUDIT_LOG_KEY = 'audit_log';

export interface AuditLogOptions {
  action: string;
  entity: string;
}

export const AuditLog = (options: AuditLogOptions) =>
  SetMetadata(AUDIT_LOG_KEY, options);

// audit-log.interceptor.ts
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private activityService: ActivityService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const auditOptions = this.reflector.get<AuditLogOptions>(
      AUDIT_LOG_KEY,
      context.getHandler(),
    );

    if (!auditOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (result) => {
        await this.activityService.log({
          userId,
          action: auditOptions.action,
          entity: auditOptions.entity,
          entityId: result?.id || request.params?.id,
          metadata: {
            duration: Date.now() - startTime,
            method: request.method,
            path: request.path,
          },
        });
      }),
    );
  }
}

// Usage in controller
@Controller('tasks')
export class TasksController {
  @Post()
  @AuditLog({ action: 'CREATE', entity: 'Task' })
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: UserPayload) {
    return this.tasksService.create(dto, user.sub);
  }

  @Patch(':id')
  @AuditLog({ action: 'UPDATE', entity: 'Task' })
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }
}
```

### Pattern 3: Builder Pattern (Search Query)

**What:** Construct complex PostgreSQL full-text search queries step by step.
**When to use:** Building complex objects/queries with many optional parts.
**Example:**
```typescript
// Source: PostgreSQL Full-Text Search docs + Builder pattern

// search-query.builder.ts
export class SearchQueryBuilder {
  private searchTerm: string = '';
  private tables: string[] = [];
  private filters: { column: string; value: any }[] = [];
  private limit: number = 20;
  private offset: number = 0;

  setSearchTerm(term: string): this {
    this.searchTerm = term;
    return this;
  }

  searchInTasks(): this {
    this.tables.push('tasks');
    return this;
  }

  searchInComments(): this {
    this.tables.push('comments');
    return this;
  }

  filterByBoard(boardId: string): this {
    this.filters.push({ column: 'board_id', value: boardId });
    return this;
  }

  paginate(limit: number, offset: number): this {
    this.limit = limit;
    this.offset = offset;
    return this;
  }

  build(): { sql: string; params: any[] } {
    const params: any[] = [];
    let paramIndex = 1;

    // Build tsquery from search term using websearch_to_tsquery for user-friendly syntax
    const searchQuery = `websearch_to_tsquery('english', $${paramIndex++})`;
    params.push(this.searchTerm);

    const unions: string[] = [];

    if (this.tables.includes('tasks')) {
      unions.push(`
        SELECT 
          'task' as type,
          t.id,
          t.title,
          t.description,
          t.board_id,
          ts_rank(
            to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')),
            ${searchQuery}
          ) as rank
        FROM tasks t
        WHERE to_tsvector('english', COALESCE(t.title, '') || ' ' || COALESCE(t.description, '')) @@ ${searchQuery}
      `);
    }

    if (this.tables.includes('comments')) {
      unions.push(`
        SELECT 
          'comment' as type,
          c.id,
          c.content as title,
          NULL as description,
          c.board_id,
          ts_rank(
            to_tsvector('english', c.content),
            ${searchQuery}
          ) as rank
        FROM comments c
        WHERE to_tsvector('english', c.content) @@ ${searchQuery}
      `);
    }

    let sql = unions.join(' UNION ALL ');

    // Apply filters
    const filterConditions = this.filters.map(f => {
      params.push(f.value);
      return `board_id = $${paramIndex++}`;
    });

    if (filterConditions.length > 0) {
      sql = `SELECT * FROM (${sql}) results WHERE ${filterConditions.join(' AND ')}`;
    }

    // Add ordering and pagination
    sql += ` ORDER BY rank DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(this.limit, this.offset);

    return { sql, params };
  }
}

// Usage in search.service.ts
@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(query: string, boardId?: string): Promise<SearchResult[]> {
    const builder = new SearchQueryBuilder()
      .setSearchTerm(query)
      .searchInTasks()
      .searchInComments()
      .paginate(20, 0);

    if (boardId) {
      builder.filterByBoard(boardId);
    }

    const { sql, params } = builder.build();
    
    return this.prisma.$queryRawUnsafe<SearchResult[]>(sql, ...params);
  }
}
```

### Pattern 4: Factory Pattern (Invitations)

**What:** Create invitation objects without specifying the exact class.
**When to use:** When object creation logic is complex or varies by type.
**Example:**
```typescript
// Source: Factory pattern adapted for NestJS

// invitation.types.ts
export enum InvitationType {
  EMAIL = 'email',
  LINK = 'link',
}

export interface InvitationData {
  boardId: string;
  role: BoardRole;
  inviterId: string;
}

// invitation.factory.ts
@Injectable()
export class InvitationFactory {
  constructor(private crypto: CryptoService) {}

  create(type: InvitationType, data: InvitationData): Prisma.InvitationCreateInput {
    switch (type) {
      case InvitationType.EMAIL:
        return this.createEmailInvitation(data);
      case InvitationType.LINK:
        return this.createLinkInvitation(data);
      default:
        throw new Error(`Unknown invitation type: ${type}`);
    }
  }

  private createEmailInvitation(data: InvitationData): Prisma.InvitationCreateInput {
    return {
      type: InvitationType.EMAIL,
      boardId: data.boardId,
      role: data.role,
      inviterId: data.inviterId,
      token: this.crypto.generateToken(32),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      maxUses: 1,
      usedCount: 0,
    };
  }

  private createLinkInvitation(data: InvitationData): Prisma.InvitationCreateInput {
    return {
      type: InvitationType.LINK,
      boardId: data.boardId,
      role: data.role,
      inviterId: data.inviterId,
      token: this.crypto.generateToken(16),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      maxUses: 10, // Shareable link can be used 10 times
      usedCount: 0,
    };
  }
}

// Usage in invitations.service.ts
@Injectable()
export class InvitationsService {
  constructor(
    private invitationFactory: InvitationFactory,
    private invitationsRepo: InvitationsRepository,
  ) {}

  async createEmailInvitation(dto: CreateEmailInvitationDto, inviterId: string) {
    const data = this.invitationFactory.create(InvitationType.EMAIL, {
      boardId: dto.boardId,
      role: dto.role,
      inviterId,
    });
    
    return this.invitationsRepo.create({
      ...data,
      email: dto.email,
    });
  }

  async createLinkInvitation(dto: CreateLinkInvitationDto, inviterId: string) {
    const data = this.invitationFactory.create(InvitationType.LINK, {
      boardId: dto.boardId,
      role: dto.role,
      inviterId,
    });
    
    return this.invitationsRepo.create(data);
  }
}
```

### Pattern 5: Strategy Pattern (RBAC Permissions)

**What:** Different permission checking logic based on user role.
**When to use:** When behavior varies based on type/role.
**Example:**
```typescript
// Source: Strategy pattern for authorization

// permission.strategy.ts - Interface
export interface PermissionStrategy {
  canRead(userId: string, boardId: string): Promise<boolean>;
  canWrite(userId: string, boardId: string): Promise<boolean>;
  canManageMembers(userId: string, boardId: string): Promise<boolean>;
  canDelete(userId: string, boardId: string): Promise<boolean>;
}

// owner-permission.strategy.ts
@Injectable()
export class OwnerPermissionStrategy implements PermissionStrategy {
  async canRead(): Promise<boolean> { return true; }
  async canWrite(): Promise<boolean> { return true; }
  async canManageMembers(): Promise<boolean> { return true; }
  async canDelete(): Promise<boolean> { return true; }
}

// admin-permission.strategy.ts
@Injectable()
export class AdminPermissionStrategy implements PermissionStrategy {
  async canRead(): Promise<boolean> { return true; }
  async canWrite(): Promise<boolean> { return true; }
  async canManageMembers(): Promise<boolean> { return true; }
  async canDelete(): Promise<boolean> { return false; } // Only owner can delete board
}

// member-permission.strategy.ts
@Injectable()
export class MemberPermissionStrategy implements PermissionStrategy {
  async canRead(): Promise<boolean> { return true; }
  async canWrite(): Promise<boolean> { return true; }
  async canManageMembers(): Promise<boolean> { return false; }
  async canDelete(): Promise<boolean> { return false; }
}

// permissions.service.ts - Context
@Injectable()
export class PermissionsService {
  private strategies: Map<BoardRole, PermissionStrategy>;

  constructor(
    ownerStrategy: OwnerPermissionStrategy,
    adminStrategy: AdminPermissionStrategy,
    memberStrategy: MemberPermissionStrategy,
  ) {
    this.strategies = new Map([
      [BoardRole.OWNER, ownerStrategy],
      [BoardRole.ADMIN, adminStrategy],
      [BoardRole.MEMBER, memberStrategy],
    ]);
  }

  async can(
    userId: string,
    boardId: string,
    action: 'read' | 'write' | 'manageMembers' | 'delete',
  ): Promise<boolean> {
    const role = await this.getUserRole(userId, boardId);
    const strategy = this.strategies.get(role);
    
    if (!strategy) {
      return false;
    }

    switch (action) {
      case 'read': return strategy.canRead(userId, boardId);
      case 'write': return strategy.canWrite(userId, boardId);
      case 'manageMembers': return strategy.canManageMembers(userId, boardId);
      case 'delete': return strategy.canDelete(userId, boardId);
    }
  }
}

// board-permission.guard.ts
@Injectable()
export class BoardPermissionGuard implements CanActivate {
  constructor(
    private permissionsService: PermissionsService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<string>(
      'permission',
      context.getHandler(),
    );
    
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.sub;
    const boardId = request.params?.boardId || request.body?.boardId;

    return this.permissionsService.can(userId, boardId, requiredPermission);
  }
}
```

### Pattern 6: Facade Pattern (BoardFacade)

**What:** Unified interface to multiple SignalStores (BoardStore, ListStore, TaskStore).
**When to use:** Simplifying complex subsystem interactions for components.
**Example:**
```typescript
// Source: @ngrx/signals + Facade pattern

// board.facade.ts
@Injectable({ providedIn: 'root' })
export class BoardFacade {
  private readonly boardStore = inject(BoardStore);
  private readonly listStore = inject(ListStore);
  private readonly taskStore = inject(TaskStore);
  private readonly commentStore = inject(CommentStore);
  private readonly activityStore = inject(ActivityStore);

  // Unified computed signals
  readonly currentBoard = this.boardStore.selectedBoard;
  readonly lists = this.listStore.sortedLists;
  readonly tasksByList = this.taskStore.tasksByList;
  
  readonly isLoading = computed(() => 
    this.boardStore.isLoading() || 
    this.listStore.isLoading() || 
    this.taskStore.isLoading()
  );

  readonly error = computed(() =>
    this.boardStore.error() ||
    this.listStore.error() ||
    this.taskStore.error()
  );

  // Board state
  readonly boardId = computed(() => this.currentBoard()?.id ?? null);
  readonly boardTitle = computed(() => this.currentBoard()?.title ?? '');

  // Combined data for components
  readonly boardData = computed(() => ({
    board: this.currentBoard(),
    lists: this.lists(),
    tasksByList: this.tasksByList(),
    isLoading: this.isLoading(),
    error: this.error(),
  }));

  // Unified actions
  loadBoard(boardId: string): void {
    this.boardStore.setSelectedBoard(boardId);
    this.listStore.loadListsForBoard(boardId);
    this.taskStore.loadTasksForBoard(boardId);
    this.activityStore.loadActivitiesForBoard(boardId);
  }

  unloadBoard(): void {
    this.boardStore.setSelectedBoard(null);
    this.listStore.clearLists();
    this.taskStore.clearTasks();
    this.activityStore.clearActivities();
  }

  // List operations
  createList(title: string): void {
    const boardId = this.boardId();
    if (boardId) {
      this.listStore.createList({ title, boardId });
    }
  }

  reorderList(listId: string, newPosition: number): void {
    this.listStore.reorderList(listId, newPosition);
  }

  // Task operations
  createTask(listId: string, title: string, description?: string): void {
    const boardId = this.boardId();
    if (boardId) {
      this.taskStore.createTask({ title, description, listId, boardId });
    }
  }

  moveTask(taskId: string, targetListId: string, newPosition: number): void {
    this.taskStore.moveTask({ taskId, targetListId, position: newPosition });
  }

  // Comment operations (delegated to CommentStore)
  loadTaskComments(taskId: string): void {
    this.commentStore.loadCommentsForTask(taskId);
  }

  addComment(taskId: string, content: string): void {
    const boardId = this.boardId();
    if (boardId) {
      this.commentStore.createComment({ taskId, boardId, content });
    }
  }

  // Activity operations
  getRecentActivity = computed(() => this.activityStore.recentActivities());
}

// Usage in component
@Component({
  template: `
    @if (facade.isLoading()) {
      <app-loading-spinner />
    } @else if (facade.error()) {
      <app-error [message]="facade.error()" />
    } @else {
      <app-kanban-board
        [board]="facade.currentBoard()"
        [lists]="facade.lists()"
        [tasksByList]="facade.tasksByList()"
        (createList)="facade.createList($event)"
        (createTask)="facade.createTask($event.listId, $event.title)"
        (moveTask)="facade.moveTask($event.taskId, $event.listId, $event.position)"
      />
    }
  `,
})
export class KanbanPage {
  protected readonly facade = inject(BoardFacade);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.route.params.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(params => {
      this.facade.loadBoard(params['id']);
    });
  }
}
```

### Anti-Patterns to Avoid

- **God Service:** Don't create one massive service handling comments, activity, search, and teams. Keep them separate.
- **Direct SQL in Controllers:** Keep raw SQL queries in repository or service layer, never in controllers.
- **Bypassing Stores:** Components should not call services directly when stores exist - use stores as single source of truth.
- **Pattern Overuse:** Don't use patterns where simple solutions work. Apply patterns to demonstrate understanding, not everywhere.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Full-text search | Custom LIKE-based search | PostgreSQL tsvector/tsquery | Proper stemming, ranking, performance |
| Mention parsing | Custom regex | Simple regex `/@(\w+)/g` + validate | Regex is simple enough, no library needed |
| Token generation | Math.random() | Node.js `crypto.randomBytes(32).toString('hex')` | Cryptographically secure |
| Date formatting | Custom formatters | Existing date-fns or built-in Intl | Edge cases, i18n, timezones |

**Key insight:** For Phase 3, PostgreSQL's built-in full-text search is more than adequate. Adding Elasticsearch would be premature optimization for a Kanban board with hundreds of tasks.

## Common Pitfalls

### Pitfall 1: N+1 Queries in Comments

**What goes wrong:** Loading task comments + author for each comment separately.
**Why it happens:** Using ORM without explicit includes.
**How to avoid:** Use Prisma includes for relations.
**Warning signs:** Multiple SQL queries for single task view.
```typescript
// Bad - N+1 queries
const comments = await prisma.comment.findMany({ where: { taskId } });
for (const comment of comments) {
  comment.author = await prisma.user.findUnique({ where: { id: comment.authorId } });
}

// Good - Single query with include
const comments = await prisma.comment.findMany({
  where: { taskId },
  include: { author: { select: { id: true, name: true, email: true } } },
});
```

### Pitfall 2: Full-Text Search Performance

**What goes wrong:** Full-text search is slow on large datasets.
**Why it happens:** Missing GIN indexes on tsvector columns.
**How to avoid:** Create proper indexes in Prisma migration.
**Warning signs:** Search queries taking >100ms.
```sql
-- Add in migration
CREATE INDEX tasks_search_idx ON tasks USING GIN (
  to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);
```

### Pitfall 3: WebSocket Memory Leaks

**What goes wrong:** Users stay subscribed to rooms after leaving.
**Why it happens:** Not cleaning up on disconnect.
**How to avoid:** Track user-room associations, clean up on disconnect.
**Warning signs:** Memory usage grows over time.

### Pitfall 4: Race Conditions in Activity Logging

**What goes wrong:** Activity entries created before the actual change succeeds.
**Why it happens:** Optimistic logging before database commit.
**How to avoid:** Log activity AFTER successful database operation, or use transactions.
**Warning signs:** Activity shows changes that didn't actually happen.

## Code Examples

Verified patterns from official sources:

### PostgreSQL Full-Text Search with Prisma

```typescript
// Source: Prisma docs + PostgreSQL FTS docs

// Single-table search
const results = await prisma.$queryRaw<Task[]>`
  SELECT id, title, description,
    ts_rank(
      to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, '')),
      websearch_to_tsquery('english', ${searchTerm})
    ) as rank
  FROM tasks
  WHERE to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
    @@ websearch_to_tsquery('english', ${searchTerm})
  ORDER BY rank DESC
  LIMIT 20
`;
```

### NestJS Factory Provider for Strategies

```typescript
// Source: NestJS docs - Custom Providers

// comments.module.ts
@Module({
  providers: [
    InAppNotificationStrategy,
    WebSocketNotificationStrategy,
    EmailNotificationStrategy,
    {
      provide: 'NOTIFICATION_STRATEGIES',
      useFactory: (
        inApp: InAppNotificationStrategy,
        ws: WebSocketNotificationStrategy,
        email: EmailNotificationStrategy,
      ) => [inApp, ws, email],
      inject: [
        InAppNotificationStrategy,
        WebSocketNotificationStrategy,
        EmailNotificationStrategy,
      ],
    },
    CommentsService,
  ],
})
export class CommentsModule {}
```

### SignalStore Entity Pattern

```typescript
// Source: @ngrx/signals docs

// comment.store.ts
export const CommentStore = signalStore(
  { providedIn: 'root' },
  withEntities<Comment>(),
  withState<CommentStoreState>({
    currentTaskId: null,
    isLoading: false,
    error: null,
  }),
  withComputed(({ entities, currentTaskId }) => ({
    taskComments: computed(() => {
      const taskId = currentTaskId();
      return taskId
        ? entities().filter(c => c.taskId === taskId).sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )
        : [];
    }),
  })),
  withMethods((store, commentService = inject(CommentService)) => ({
    loadCommentsForTask: rxMethod<string>(
      pipe(
        tap(taskId => patchState(store, { currentTaskId: taskId, isLoading: true })),
        switchMap(taskId =>
          commentService.getCommentsForTask(taskId).pipe(
            tapResponse({
              next: comments => patchState(store, setAllEntities(comments), { isLoading: false }),
              error: (err: Error) => patchState(store, { error: err.message, isLoading: false }),
            })
          )
        )
      )
    ),
    createComment: rxMethod<CreateCommentDto>(
      pipe(
        switchMap(dto =>
          commentService.createComment(dto).pipe(
            tapResponse({
              next: comment => patchState(store, addEntity(comment)),
              error: (err: Error) => patchState(store, { error: err.message }),
            })
          )
        )
      )
    ),
  }))
);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| @Input/@Output decorators | input()/output() functions | Angular 17+ | Cleaner component APIs |
| NgRx Store | SignalStore | 2024 | Simpler reactive state |
| *ngIf, *ngFor | @if, @for control flow | Angular 17 | Better template syntax |
| Constructor injection | inject() function | Angular 14+ | More flexible DI |

**Deprecated/outdated:**
- `@Input()` decorator: Use `input()` function instead
- Classic NgRx Store with actions/reducers: SignalStore is simpler for new code
- `*ngIf`, `*ngFor`: Use `@if`, `@for` built-in control flow

## Prisma Schema Extensions

### New Models Required

```prisma
// Add to apps/api/prisma/schema.prisma

model Comment {
  id        String   @id @default(cuid())
  content   String
  taskId    String   @map("task_id")
  boardId   String   @map("board_id")
  authorId  String   @map("author_id")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  task   Task  @relation(fields: [taskId], references: [id], onDelete: Cascade)
  board  Board @relation(fields: [boardId], references: [id], onDelete: Cascade)
  author User  @relation(fields: [authorId], references: [id])

  @@map("comments")
}

model Activity {
  id        String   @id @default(cuid())
  action    String   // CREATE, UPDATE, DELETE, MOVE, etc.
  entity    String   // Task, List, Comment, etc.
  entityId  String   @map("entity_id")
  boardId   String   @map("board_id")
  userId    String   @map("user_id")
  metadata  Json?    // Additional context
  createdAt DateTime @default(now()) @map("created_at")

  board Board @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@index([boardId, createdAt])
  @@map("activities")
}

model TeamMember {
  id        String    @id @default(cuid())
  boardId   String    @map("board_id")
  userId    String    @map("user_id")
  role      BoardRole @default(MEMBER)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  board Board @relation(fields: [boardId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([boardId, userId])
  @@map("team_members")
}

model Invitation {
  id        String         @id @default(cuid())
  type      InvitationType
  token     String         @unique
  boardId   String         @map("board_id")
  inviterId String         @map("inviter_id")
  email     String?        // Only for email invitations
  role      BoardRole      @default(MEMBER)
  expiresAt DateTime       @map("expires_at")
  maxUses   Int            @default(1) @map("max_uses")
  usedCount Int            @default(0) @map("used_count")
  createdAt DateTime       @default(now()) @map("created_at")

  board   Board @relation(fields: [boardId], references: [id], onDelete: Cascade)
  inviter User  @relation(fields: [inviterId], references: [id])

  @@map("invitations")
}

enum BoardRole {
  OWNER
  ADMIN
  MEMBER
}

enum InvitationType {
  EMAIL
  LINK
}

// Update existing models to add relations
model Board {
  // ... existing fields ...
  comments    Comment[]
  activities  Activity[]
  teamMembers TeamMember[]
  invitations Invitation[]
}

model User {
  // ... existing fields ...
  comments        Comment[]
  activities      Activity[]
  teamMemberships TeamMember[]
  invitations     Invitation[]
}

model Task {
  // ... existing fields ...
  comments Comment[]
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Real Email Sending**
   - What we know: Mock email strategy for demo is fine
   - What's unclear: Production requirements for actual email service
   - Recommendation: Keep mock for Phase 3, document that production would use SendGrid/SES

2. **Mention Notification Aggregation**
   - What we know: Users can be mentioned multiple times
   - What's unclear: Should notifications be batched/deduplicated?
   - Recommendation: Single notification per mention for simplicity

3. **Search Index Updates**
   - What we know: PostgreSQL tsvector works without stored columns
   - What's unclear: Whether to add stored `search_vector` columns for performance
   - Recommendation: Start without stored columns, add if performance issues arise

## Sources

### Primary (HIGH confidence)

- [PostgreSQL Full-Text Search docs](https://www.postgresql.org/docs/current/textsearch.html) - tsvector, tsquery, ranking
- [Prisma raw queries docs](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries) - $queryRaw, $queryRawUnsafe
- [NestJS custom providers docs](https://docs.nestjs.com/fundamentals/custom-providers) - useFactory, useClass
- [@ngrx/signals SignalStore docs](https://ngrx.io/guide/signals/signal-store) - withState, withComputed, withMethods

### Secondary (MEDIUM confidence)

- Existing codebase patterns (BoardStore, ListStore, TaskStore implementations)
- Existing schema patterns (User, Board, List, Task models)

### Tertiary (LOW confidence)

- None - all patterns verified against official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing packages, no new dependencies
- Architecture: HIGH - Patterns well-documented and appropriate
- Prisma schema: HIGH - Following existing conventions
- PostgreSQL FTS: HIGH - Verified with official PostgreSQL docs
- Design patterns: HIGH - Classic GoF patterns adapted for NestJS/Angular

**Research date:** March 15, 2026
**Valid until:** June 2026 (Angular 21, NestJS 10, Prisma 5 all stable)
