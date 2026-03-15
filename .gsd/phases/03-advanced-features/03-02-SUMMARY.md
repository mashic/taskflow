---
phase: 03-advanced-features
plan: 02
subsystem: activity
tags: [decorator-pattern, audit-logging, interceptors, SignalStore]
dependency-graph:
  requires: [03-01]
  provides: [activity-logging, audit-trail]
  affects: [03-05, 03-06]
tech-stack:
  added: []
  patterns: [Decorator Pattern via NestJS Interceptors]
key-files:
  created:
    - apps/api/src/activity/decorators/audit-log.decorator.ts
    - apps/api/src/activity/interceptors/audit-log.interceptor.ts
    - apps/api/src/activity/activity.repository.ts
    - apps/api/src/activity/activity.service.ts
    - apps/api/src/activity/activity.controller.ts
    - apps/api/src/activity/activity.module.ts
    - apps/web/src/app/features/activity/activity.service.ts
    - apps/web/src/app/features/activity/activity.store.ts
    - apps/web/src/app/features/activity/activity-feed.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/tasks/tasks.controller.ts
    - apps/api/src/lists/lists.controller.ts
    - apps/api/src/comments/comments.controller.ts
    - apps/api/src/app.module.ts
decisions:
  - "@AuditLog decorator with AuditLogInterceptor for transparent audit logging"
  - "Global APP_INTERCEPTOR registration for automatic method wrapping"
  - "Activity stored with JSON data field for flexible metadata"
metrics:
  duration: ~4min
  completed: 2026-03-15
---

# Phase 3 Plan 2: Activity Log with Decorator Pattern Summary

**One-liner:** Decorator pattern audit logging via @AuditLog and AuditLogInterceptor wrapping controller methods transparently.

## What Was Built

### Backend (NestJS)

1. **Activity Model** - Prisma schema with:
   - id, type, entityType, entityId, boardId, userId, data (JSON), createdAt
   - Relations to Board and User models
   - Index on boardId + createdAt for efficient queries

2. **@AuditLog Decorator** - SetMetadata-based decorator:
   ```typescript
   @AuditLog({ action: 'created', entity: 'task' })
   ```

3. **AuditLogInterceptor** - Global interceptor that:
   - Reads @AuditLog metadata from handler
   - Wraps method execution with tap()
   - Logs activity after successful response
   - Sanitizes result data (removes password, refreshToken)

4. **ActivityService/Repository** - Service layer for:
   - log(data) - creates activity records
   - getByBoard(boardId, limit) - recent board activities
   - getByEntity(entityType, entityId) - entity history

5. **ActivityController** - REST endpoints:
   - GET /activity/board/:boardId - board activity feed
   - GET /activity/:entityType/:entityId - entity history

### Frontend (Angular)

1. **ActivityService** - HTTP client for activity endpoints

2. **ActivityStore** - SignalStore with:
   - activities state with loading/error
   - loadActivities rxMethod
   - addActivity for WebSocket updates
   - recentActivities computed (sorted)

3. **ActivityFeedComponent** - Timeline UI with:
   - User avatar with initials
   - Formatted action descriptions
   - Relative timestamps
   - Loading/empty/error states

## Design Pattern: Decorator (GoF)

**Definition:** Attach additional responsibilities to an object dynamically without modifying its structure.

**Implementation:** 
- `@AuditLog()` decorator marks methods for logging
- `AuditLogInterceptor` wraps method execution
- Activities logged transparently after success
- Controllers don't know about logging logic

**Interview talking point:** "I used the Decorator pattern via NestJS interceptors to add audit logging without modifying existing controller logic. The @AuditLog decorator marks methods for logging, and the interceptor handles the cross-cutting concern transparently."

## Controllers Updated

Methods decorated with @AuditLog:
- **TasksController**: create, update, move, delete
- **ListsController**: create, update, reorder, delete
- **CommentsController**: create, delete

## Deviations from Plan

None - plan executed exactly as written.

## Commits

- `885bbca`: feat: activity log with Decorator pattern (03-02)

## Next Phase Readiness

Ready for:
- 03-03: Full-text search (already completed)
- 03-05: Labels/Tags
- 03-06: Due dates/Notifications

No blockers.
