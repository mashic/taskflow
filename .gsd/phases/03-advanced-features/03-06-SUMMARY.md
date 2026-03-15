---
phase: 03-advanced-features
plan: 06
subsystem: state-management
tags: [facade-pattern, signalstore, angular, state]
completed: 2026-03-15

requires:
  - 03-01 (CommentStore)
  - 03-02 (ActivityStore)
  - 03-05 (TeamStore with roles)
provides:
  - BoardFacade unified interface to all board stores
  - Simplified component injection pattern
  - Composed signals for derived state
affects:
  - Board-related components (KanbanPage, task views)

tech-stack:
  patterns:
    - "Facade Pattern for store subsystem"
    - "Composed signals from multiple stores"
    - "Single injection point for complex views"

key-files:
  created:
    - apps/web/src/app/features/kanban/board.facade.ts
    - apps/web/src/app/features/kanban/board.facade.spec.ts
  modified:
    - apps/web/src/app/features/kanban/kanban.page.ts

decisions:
  - "Single facade wraps Board, List, Task, Comment, Activity, Team stores"
  - "Computed isLoading/error combine state from multiple stores"
  - "Facade handles WebSocket room management"

metrics:
  duration: ~4 min
---

# Phase 03 Plan 06: BoardFacade with Facade Pattern Summary

**One-liner:** Facade pattern unifying 6 SignalStores with composed signals and simplified component API

## What Was Built

### Facade Pattern Implementation

```
BoardFacade (@Injectable providedIn: 'root')
├── BoardStore     → board selection and entities
├── ListStore      → list CRUD and ordering
├── TaskStore      → task CRUD and drag-drop
├── CommentStore   → task comments
├── ActivityStore  → board activity log
├── TeamStore      → team members
└── WebSocketService → room management
```

### Unified Interface

| Category | Signals | Methods |
|----------|---------|---------|
| Board | currentBoard, boardId, boardTitle | loadBoard, unloadBoard, switchBoard |
| Lists | lists | createList, updateList, deleteList, reorderList |
| Tasks | tasksByList | createTask, updateTask, deleteTask, moveTask |
| Comments | taskComments, commentCount | loadTaskComments, addComment |
| Activity | recentActivity | - |
| Team | teamMembers, membersByRole | refreshTeamMembers |
| Combined | isLoading, error, boardData | - |

### Component Simplification

**Before (5 injections):**
```typescript
boardStore = inject(BoardStore);
listStore = inject(ListStore);
taskStore = inject(TaskStore);
wsService = inject(WebSocketService);
// Multiple manual calls in ngOnInit
```

**After (1 injection):**
```typescript
readonly facade = inject(BoardFacade);
// Single call: facade.loadBoard(id)
```

## Design Pattern: Facade

**GoF Definition:** "Provide a unified interface to a set of interfaces in a subsystem."

**Implementation Details:**
- Facade injects all 6 stores privately
- Exposes composed signals (e.g., `isLoading` combines 3 stores)
- Coordinates cross-store operations (loadBoard loads all related data)
- Manages WebSocket lifecycle automatically

**Interview Talking Point:**
"I used the Facade pattern to simplify component code. Instead of injecting 5 stores and coordinating their state, components inject one BoardFacade that provides a unified API. This reduces coupling and makes the component code cleaner and easier to test."

## Key Changes

### BoardFacade (`board.facade.ts`)
- Private injections: BoardStore, ListStore, TaskStore, CommentStore, ActivityStore, TeamStore, WebSocketService
- Composed signals: `isLoading`, `error`, `boardData`
- Board lifecycle: `loadBoard()`, `unloadBoard()`, `switchBoard()`
- Task positioning: `calculateTaskPosition()` for drag-drop

### KanbanPage Refactoring
- Reduced from 5 injections to 1 facade injection
- Simplified ngOnInit to single `facade.loadBoard()` call
- Route change handling via `facade.switchBoard()`
- Cleanup via `facade.unloadBoard()`

## Deviations from Plan

None - plan executed as specified.

## Commits

- `a9e6b2f`: feat: BoardFacade with Facade pattern (03-06)

## Next Steps

Phase 3 complete. Ready for Phase 4 (Production Readiness).
