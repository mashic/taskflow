---
phase: 03-advanced-features
plan: 05
subsystem: permissions
tags: [rbac, strategy-pattern, guards, nestjs]
completed: 2026-03-15

requires:
  - 03-04 (TeamMember model with roles)
provides:
  - Role-based access control via Strategy pattern
  - Permission guard and decorator system
affects:
  - All board-related controllers

tech-stack:
  patterns:
    - "Strategy Pattern for role-based permissions"
    - "Decorator pattern for permission metadata"
    - "Guard pattern for request interception"

key-files:
  created:
    - apps/api/src/permissions/strategies/permission.strategy.ts
    - apps/api/src/permissions/strategies/owner-permission.strategy.ts
    - apps/api/src/permissions/strategies/admin-permission.strategy.ts
    - apps/api/src/permissions/strategies/member-permission.strategy.ts
    - apps/api/src/permissions/permissions.service.ts
    - apps/api/src/permissions/permissions.guard.ts
    - apps/api/src/permissions/permissions.module.ts
    - apps/api/src/permissions/decorators/require-permission.decorator.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/boards/boards.controller.ts
    - apps/api/src/lists/lists.controller.ts
    - apps/api/src/tasks/tasks.controller.ts
    - apps/api/src/teams/teams.controller.ts
    - packages/shared-types/src/index.ts

decisions:
  - "Strategy per role (Owner/Admin/Member) instead of permission matrix"
  - "Guard extracts boardId from params, body, or entity lookup"
  - "Permission actions: read, write, manageMembers, delete"

metrics:
  duration: ~5 min
---

# Phase 03 Plan 05: Role-based Permissions Summary

**One-liner:** Strategy pattern RBAC with Owner/Admin/Member strategies and BoardPermissionGuard

## What Was Built

### Strategy Pattern Implementation

```
PermissionStrategy (interface)
├── OwnerPermissionStrategy   → all permissions
├── AdminPermissionStrategy   → all except delete board
└── MemberPermissionStrategy  → read + write only
```

### Permission Matrix

| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| read | ✓ | ✓ | ✓ |
| write | ✓ | ✓ | ✓ |
| manageMembers | ✓ | ✓ | ✗ |
| delete | ✓ | ✗ | ✗ |

### Key Components

1. **PermissionsService**
   - Strategy map: `Map<BoardRole, PermissionStrategy>`
   - `getUserRole(userId, boardId)` - checks ownership + team membership
   - `can(userId, boardId, action)` - delegates to appropriate strategy

2. **BoardPermissionGuard**
   - Reads `@RequirePermission()` metadata
   - Extracts boardId from params, body, or entity lookup
   - Calls `permissionsService.can()` to authorize

3. **RequirePermission Decorator**
   - `@RequirePermission('read' | 'write' | 'manageMembers' | 'delete')`
   - Sets metadata for guard to read

### Controller Integration

```typescript
// Board operations
@Delete(':id')
@UseGuards(BoardPermissionGuard)
@RequirePermission('delete')  // Only owner allowed
async remove(@Param('id') id: string) { ... }

// Team operations
@Patch('members/:id/role')
@UseGuards(BoardPermissionGuard)
@RequirePermission('manageMembers')  // Owner + Admin allowed
async updateRole(...) { ... }
```

## Interview Talking Point

> "I used the Strategy pattern for RBAC because each role has distinct permission rules. The strategy map lets me add new roles (like VIEWER) without modifying existing code - just add a new strategy class. The guard handles boardId extraction from various sources (params, body, entity lookup), making it work with nested routes like `/lists/:id` and `/tasks/:id`."

## Files Created

| File | Purpose |
|------|---------|
| `permission.strategy.ts` | Strategy interface |
| `owner-permission.strategy.ts` | Owner: full access |
| `admin-permission.strategy.ts` | Admin: no delete |
| `member-permission.strategy.ts` | Member: no manage/delete |
| `permissions.service.ts` | Strategy selector |
| `permissions.guard.ts` | Request interceptor |
| `require-permission.decorator.ts` | Metadata decorator |
| `permissions.module.ts` | NestJS module |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

- Permission system ready for use across all board operations
- Easy to add new roles (VIEWER, GUEST) by adding new strategy
- Can extend actions (archive, export, etc.) in strategy interface
