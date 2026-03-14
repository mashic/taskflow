# Phase 2: Core Features - Research

**Researched:** 2026-03-14
**Domain:** Kanban Board Implementation (CRUD, Drag-Drop, Real-time, SignalStore)
**Confidence:** HIGH

## Summary

Phase 2 implements the core Kanban functionality for TaskFlow. Research covers six key domains:

1. **Prisma Schema** for Board → List → Task hierarchy with position ordering
2. **SignalStore Entity Adapter** for managing board/task collections efficiently
3. **CDK Drag-Drop** for horizontal lists and vertical tasks with reordering
4. **NestJS WebSocket Gateway** for real-time event broadcasting
5. **Optimistic Update Patterns** for responsive UI with server reconciliation
6. **Position-based Ordering** using fractional indices for efficient reordering

The standard approach uses `@ngrx/signals/entities` for collection management, Angular CDK drag-drop with `cdkDropListGroup` for connected Kanban columns, and Socket.io via `@nestjs/websockets` for real-time sync.

**Primary recommendation:** Use entity collections per model (BoardStore, ListStore, TaskStore), CDK `cdkDropListGroup` with `moveItemInArray`/`transferArrayItem` utilities, and a centralized WebSocket gateway broadcasting domain events.

## Standard Stack

### Core Dependencies (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ngrx/signals | ^21.0.1 | SignalStore state management | Angular 21 native, signal-based |
| @prisma/client | 6.19.2 | Database ORM | Type-safe, schema-first |
| rxjs | ^7.8.x | Reactive streams | WebSocket integration, rxMethod |

### New Dependencies to Install

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @angular/cdk | ^21.x | Drag-drop directives | Kanban reordering |
| @nestjs/websockets | ^11.x | WebSocket support | Real-time gateway |
| @nestjs/platform-socket.io | ^11.x | Socket.io adapter | WebSocket transport |
| socket.io-client | ^4.x | Frontend WebSocket | Connect to gateway |
| @ngrx/operators | ^21.x | tapResponse helper | Safe API response handling |

### Installation Commands

```bash
# Frontend (apps/web)
pnpm add @angular/cdk @ngrx/operators socket.io-client

# Backend (apps/api)
pnpm add @nestjs/websockets @nestjs/platform-socket.io
```

## Architecture Patterns

### Recommended Project Structure

```
apps/api/src/
├── boards/
│   ├── boards.module.ts
│   ├── boards.controller.ts
│   ├── boards.service.ts
│   ├── boards.repository.ts
│   ├── boards.gateway.ts          # WebSocket gateway
│   └── dto/
│       ├── create-board.dto.ts
│       ├── update-board.dto.ts
│       └── reorder.dto.ts
├── lists/
│   ├── lists.module.ts
│   ├── lists.controller.ts
│   ├── lists.service.ts
│   └── lists.repository.ts
├── tasks/
│   ├── tasks.module.ts
│   ├── tasks.controller.ts
│   ├── tasks.service.ts
│   └── tasks.repository.ts
└── events/
    ├── events.module.ts
    └── events.gateway.ts           # Centralized WebSocket gateway

apps/web/src/app/
├── core/
│   ├── websocket/
│   │   ├── websocket.service.ts    # Socket.io client
│   │   └── websocket.config.ts
│   └── stores/
│       └── sync.store.ts           # Optimistic update tracking
├── features/
│   ├── boards/
│   │   ├── board.store.ts
│   │   ├── board.service.ts
│   │   ├── board-list.page.ts
│   │   └── board-create.dialog.ts
│   └── kanban/
│       ├── kanban.page.ts
│       ├── kanban-list.ts
│       ├── kanban-task.ts
│       ├── list.store.ts
│       └── task.store.ts
```

### Pattern 1: SignalStore with Entity Adapter

**What:** Use `withEntities` from `@ngrx/signals/entities` for collection state
**When to use:** Any collection of entities (boards, lists, tasks)

```typescript
// Source: https://ngrx.io/guide/signals/signal-store/entity-management
import { computed } from '@angular/core';
import { signalStore, withComputed, withMethods } from '@ngrx/signals';
import { 
  withEntities, 
  addEntity, 
  updateEntity, 
  removeEntity,
  setAllEntities
} from '@ngrx/signals/entities';
import { Board } from '@taskflow/shared-types';

export const BoardStore = signalStore(
  { providedIn: 'root' },
  withEntities<Board>(),
  withComputed(({ entities }) => ({
    boardCount: computed(() => entities().length),
    sortedBoards: computed(() => 
      entities().toSorted((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
    ),
  })),
  withMethods((store) => ({
    addBoard(board: Board): void {
      patchState(store, addEntity(board));
    },
    updateBoard(id: string, changes: Partial<Board>): void {
      patchState(store, updateEntity({ id, changes }));
    },
    removeBoard(id: string): void {
      patchState(store, removeEntity(id));
    },
    setBoards(boards: Board[]): void {
      patchState(store, setAllEntities(boards));
    },
  }))
);
```

### Pattern 2: CDK Drag-Drop Connected Lists (Kanban)

**What:** Use `cdkDropListGroup` to connect multiple lists automatically
**When to use:** Kanban board with multiple columns

```typescript
// Source: https://angular.dev/guide/drag-drop
import { Component } from '@angular/core';
import { 
  CdkDragDrop, 
  CdkDrag, 
  CdkDropList, 
  CdkDropListGroup,
  moveItemInArray, 
  transferArrayItem 
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CdkDropListGroup, CdkDropList, CdkDrag],
  template: `
    <div class="board" cdkDropListGroup>
      @for (list of lists(); track list.id) {
        <div class="list">
          <h3>{{ list.title }}</h3>
          <div
            cdkDropList
            [cdkDropListData]="getTasksForList(list.id)"
            (cdkDropListDropped)="drop($event)"
            class="task-container"
          >
            @for (task of getTasksForList(list.id); track task.id) {
              <div cdkDrag [cdkDragData]="task" class="task-card">
                {{ task.title }}
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class KanbanBoardComponent {
  drop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      // Reorder within same list
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      // Move to different list
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    // Emit position update to store/server
    this.onTaskMoved(event);
  }
}
```

### Pattern 3: NestJS WebSocket Gateway

**What:** Create WebSocket gateway for real-time event broadcasting
**When to use:** Real-time sync across clients

```typescript
// Source: https://docs.nestjs.com/websockets/gateways
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // Configure properly for production
  namespace: '/boards',
})
export class BoardsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinBoard')
  handleJoinBoard(
    @MessageBody() boardId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`board:${boardId}`);
    return { event: 'joinedBoard', data: boardId };
  }

  @SubscribeMessage('leaveBoard')
  handleLeaveBoard(
    @MessageBody() boardId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(`board:${boardId}`);
  }

  // Called by services when data changes
  broadcastTaskMoved(boardId: string, data: TaskMovedEvent) {
    this.server.to(`board:${boardId}`).emit('taskMoved', data);
  }

  broadcastTaskCreated(boardId: string, data: Task) {
    this.server.to(`board:${boardId}`).emit('taskCreated', data);
  }
}
```

### Pattern 4: Optimistic Updates with Reconciliation

**What:** Update UI immediately, reconcile with server response
**When to use:** Any mutation where latency matters (especially drag-drop)

```typescript
// Optimistic update pattern for task move
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap } from 'rxjs';

interface SyncState {
  pendingOperations: Map<string, PendingOperation>;
  lastSyncedAt: Date | null;
}

export const TaskStore = signalStore(
  { providedIn: 'root' },
  withEntities<Task>(),
  withState<SyncState>({
    pendingOperations: new Map(),
    lastSyncedAt: null,
  }),
  withMethods((store, taskService = inject(TaskService)) => ({
    // Optimistic move
    moveTask: rxMethod<MoveTaskRequest>(
      pipe(
        tap((req) => {
          // 1. Optimistically update local state
          patchState(store, updateEntity({
            id: req.taskId,
            changes: { 
              listId: req.toListId, 
              position: req.newPosition 
            }
          }));
          // Track pending operation
          store.pendingOperations().set(req.taskId, {
            type: 'move',
            originalState: store.entityMap()[req.taskId],
          });
        }),
        switchMap((req) => 
          taskService.moveTask(req).pipe(
            tapResponse({
              next: (serverTask) => {
                // 2. Reconcile with server response
                patchState(store, updateEntity({
                  id: serverTask.id,
                  changes: serverTask,
                }));
                store.pendingOperations().delete(req.taskId);
              },
              error: (err) => {
                // 3. Rollback on error
                const pending = store.pendingOperations().get(req.taskId);
                if (pending?.originalState) {
                  patchState(store, setEntity(pending.originalState));
                }
                store.pendingOperations().delete(req.taskId);
                console.error('Move failed, rolled back:', err);
              },
            })
          )
        )
      )
    ),
  }))
);
```

### Anti-Patterns to Avoid

- **Global entity store for everything:** Use separate stores per entity type (BoardStore, ListStore, TaskStore), not one giant store
- **Direct DOM manipulation for drag-drop:** Use CDK directives, not manual element positioning
- **Polling for updates:** Use WebSocket push, not interval-based polling
- **Full board refetch on task move:** Use targeted entity updates via WebSocket events
- **Integer positions with shift-all reorder:** Use fractional indices or only update affected positions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag-drop UI | Custom pointer events | Angular CDK drag-drop | Accessibility, animations, touch support |
| Entity collection state | Custom array management | @ngrx/signals/entities | Normalized state, efficient updates |
| WebSocket connection | Raw WebSocket API | socket.io-client | Reconnection, rooms, fallback transports |
| Position ordering | Integer positions | Fractional indices or lexorank | Avoids cascade updates |
| Response error handling | try/catch everywhere | @ngrx/operators tapResponse | Consistent, type-safe |

**Key insight:** CDK drag-drop handles complex scenarios (touch, keyboard accessibility, animations, placeholders) that would take weeks to build correctly. `withEntities` provides normalized entity management with all standard CRUD operations.

## Common Pitfalls

### Pitfall 1: Position Integer Cascade

**What goes wrong:** Using integer positions (1, 2, 3) causes cascade updates when inserting between items
**Why it happens:** Moving task from position 5 to position 2 requires updating positions 2, 3, 4 → 3, 4, 5
**How to avoid:** Use fractional indices (2.5 between 2 and 3) or lexicographic ranking
**Warning signs:** Slow reordering, many database updates per move

```typescript
// BAD: Integer positions
position: 1, 2, 3, 4, 5
// Insert at 2 requires updating 3 items

// GOOD: Fractional indices
position: 1.0, 2.0, 3.0, 4.0, 5.0
// Insert between 2 and 3 → position: 2.5
// Only 1 item updated
```

### Pitfall 2: WebSocket Room Management

**What goes wrong:** Broadcasting to all connected clients instead of board-specific rooms
**Why it happens:** Not implementing room join/leave properly
**How to avoid:** Join room on navigate to board, leave on navigate away
**Warning signs:** Users seeing updates for boards they're not viewing

### Pitfall 3: Race Conditions in Optimistic Updates

**What goes wrong:** Multiple rapid moves cause state inconsistency
**Why it happens:** Older server responses overwriting newer local state
**How to avoid:** 
- Track operation timestamps or sequence numbers
- Ignore stale responses
- Use operation queuing for same entity

### Pitfall 4: CDK Drag-Drop Array Mutation

**What goes wrong:** `moveItemInArray` mutates arrays directly
**Why it happens:** CDK operates on mutable arrays, not signals
**How to avoid:** 
- Create array copies before mutation
- Update store after CDK completes mutation
- Don't bind signal arrays directly to `cdkDropListData`

```typescript
// WRONG: Signal array directly
[cdkDropListData]="taskStore.entities()"

// RIGHT: Create working copy
tasks = computed(() => [...this.taskStore.entities()]);
// Then sync back to store after drop
```

### Pitfall 5: WebSocket Reconnection State

**What goes wrong:** Missed events during disconnection, stale state on reconnect
**Why it happens:** No reconnection strategy or state sync
**How to avoid:**
- socket.io has built-in reconnection
- Fetch current state on reconnect
- Use `connection` event to refresh data

## Code Examples

### Prisma Schema for Board/List/Task

```prisma
// Source: Prisma relations documentation
model Board {
  id          String   @id @default(cuid())
  title       String
  description String?
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id])
  lists       List[]
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  deletedAt   DateTime? @map("deleted_at")
  
  @@map("boards")
}

model List {
  id        String   @id @default(cuid())
  title     String
  position  Float    // Fractional for efficient reordering
  boardId   String   @map("board_id")
  board     Board    @relation(fields: [boardId], references: [id], onDelete: Cascade)
  tasks     Task[]
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  @@index([boardId, position])
  @@map("lists")
}

model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  position    Float    // Fractional for efficient reordering
  listId      String   @map("list_id")
  list        List     @relation(fields: [listId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  @@index([listId, position])
  @@map("tasks")
}
```

### Frontend WebSocket Service

```typescript
// apps/web/src/app/core/websocket/websocket.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private socket: Socket | null = null;
  
  readonly status = signal<ConnectionStatus>('disconnected');
  readonly currentBoardId = signal<string | null>(null);

  connect(): void {
    if (this.socket?.connected) return;
    
    this.status.set('connecting');
    this.socket = io(`${environment.apiUrl}/boards`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      this.status.set('connected');
      // Rejoin board room if previously joined
      const boardId = this.currentBoardId();
      if (boardId) this.joinBoard(boardId);
    });

    this.socket.on('disconnect', () => {
      this.status.set('disconnected');
    });
  }

  joinBoard(boardId: string): void {
    this.currentBoardId.set(boardId);
    this.socket?.emit('joinBoard', boardId);
  }

  leaveBoard(boardId: string): void {
    this.currentBoardId.set(null);
    this.socket?.emit('leaveBoard', boardId);
  }

  on<T>(event: string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

### Position Calculation Utility

```typescript
// apps/api/src/common/position.util.ts

/**
 * Calculate new position between two existing positions.
 * Uses fractional indices to avoid cascade updates.
 */
export function calculatePosition(before: number | null, after: number | null): number {
  if (before === null && after === null) {
    // First item
    return 1.0;
  }
  if (before === null) {
    // Insert at beginning
    return after! / 2;
  }
  if (after === null) {
    // Insert at end
    return before + 1.0;
  }
  // Insert between
  return (before + after) / 2;
}

/**
 * Check if positions need rebalancing (too many decimal places).
 * Trigger rebalance when precision exceeds threshold.
 */
export function needsRebalance(position: number): boolean {
  const decimals = (position.toString().split('.')[1] || '').length;
  return decimals > 10;
}

/**
 * Rebalance positions for a list of items.
 * Assigns clean integer positions starting from 1.
 */
export function rebalancePositions<T extends { position: number }>(
  items: T[]
): T[] {
  return items
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({
      ...item,
      position: (index + 1) * 1000, // Leave room for insertions
    }));
}
```

### Repository Pattern for Lists

```typescript
// apps/api/src/lists/lists.repository.ts
import { Injectable } from '@nestjs/common';
import { List, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ListsRepository {
  constructor(private prisma: PrismaService) {}

  async findByBoardId(boardId: string): Promise<List[]> {
    return this.prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      include: { tasks: { orderBy: { position: 'asc' } } },
    });
  }

  async create(data: Prisma.ListCreateInput): Promise<List> {
    return this.prisma.list.create({ data });
  }

  async updatePosition(id: string, position: number): Promise<List> {
    return this.prisma.list.update({
      where: { id },
      data: { position },
    });
  }

  async rebalancePositions(boardId: string): Promise<void> {
    const lists = await this.findByBoardId(boardId);
    await this.prisma.$transaction(
      lists.map((list, index) =>
        this.prisma.list.update({
          where: { id: list.id },
          data: { position: (index + 1) * 1000 },
        })
      )
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| NgRx Store + Effects | SignalStore + rxMethod | 2024 | 60% less boilerplate |
| *ngFor directive | @for control flow | Angular 17+ | Better type inference |
| Constructor injection | inject() function | Angular 14+ | Cleaner, functional |
| Integer position reorder | Fractional indices | Best practice | O(1) vs O(n) updates |
| HTTP polling | WebSocket push | Standard | Real-time, efficient |

**Deprecated/outdated:**
- `@Input()/@Output()` decorators → use `input()`/`output()` signals
- `*ngIf/*ngFor` directives → use `@if/@for` block syntax
- Classic NgRx Store → use SignalStore for new projects

## Open Questions

1. **Position rebalance trigger**
   - What we know: Fractional indices eventually need rebalancing
   - What's unclear: Background job vs on-demand vs periodic?
   - Recommendation: Trigger rebalance when precision > 10 decimals, run as part of position update transaction

2. **WebSocket authentication**
   - What we know: Socket.io supports handshake auth
   - What's unclear: JWT in query param vs handshake data?
   - Recommendation: Use handshake auth with JWT token, verify in gateway

3. **Offline support scope**
   - What we know: Optimistic updates help perceived performance
   - What's unclear: Should TaskFlow support true offline mode?
   - Recommendation: Defer for Phase 1, focus on optimistic updates only

## Sources

### Primary (HIGH confidence)

- NgRx Signals Entity Management - https://ngrx.io/guide/signals/signal-store/entity-management
- NgRx Signals RxJS Integration - https://ngrx.io/guide/signals/rxjs-integration
- Angular CDK Drag Drop - https://angular.dev/guide/drag-drop
- NestJS WebSocket Gateways - https://docs.nestjs.com/websockets/gateways
- Prisma Relations - https://www.prisma.io/docs/orm/prisma-schema/data-model/relations

### Secondary (MEDIUM confidence)

- Angular CDK API Reference - https://angular.dev/api#angular_cdk_drag-drop
- NestJS WebSocket Adapters - https://docs.nestjs.com/websockets/adapter
- Prisma One-to-Many Relations - https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/one-to-many-relations

### Workspace Context

- Existing AuthStore pattern: [apps/web/src/app/core/auth/auth.store.ts](apps/web/src/app/core/auth/auth.store.ts)
- Existing Repository pattern: [apps/api/src/users/users.repository.ts](apps/api/src/users/users.repository.ts)
- Existing Prisma schema: [apps/api/prisma/schema.prisma](apps/api/prisma/schema.prisma)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official documentation verified
- Architecture patterns: HIGH - Based on existing codebase patterns + official docs
- Prisma schema: HIGH - Standard one-to-many relations
- SignalStore entities: HIGH - Official NgRx documentation
- CDK drag-drop: HIGH - Official Angular documentation
- WebSocket gateway: HIGH - Official NestJS documentation
- Optimistic updates: MEDIUM - Pattern composition, no single authoritative source
- Position ordering: MEDIUM - Multiple approaches exist, fractional is recommended

**Research date:** 2026-03-14
**Valid until:** 2026-04-14 (30 days - stable technologies)
