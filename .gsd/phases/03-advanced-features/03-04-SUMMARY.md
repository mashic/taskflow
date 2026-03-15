---
phase: 03-advanced-features
plan: 04
subsystem: teams
tags: [factory-pattern, invitations, team-management, nestjs, angular, signalstore]
dependency-graph:
  requires: [01-03, 02-01]
  provides: [team-invitations, invitation-factory]
  affects: [03-06]
tech-stack:
  added: []
  patterns: [factory, repository]
key-files:
  created:
    - apps/api/src/invitations/factories/invitation.factory.ts
    - apps/api/src/invitations/invitations.service.ts
    - apps/api/src/invitations/invitations.controller.ts
    - apps/api/src/invitations/invitations.repository.ts
    - apps/api/src/invitations/invitations.module.ts
    - apps/api/src/invitations/dto/create-invitation.dto.ts
    - apps/api/src/teams/teams.service.ts
    - apps/api/src/teams/teams.controller.ts
    - apps/api/src/teams/teams.repository.ts
    - apps/api/src/teams/teams.module.ts
    - apps/web/src/app/features/teams/team.service.ts
    - apps/web/src/app/features/teams/team.store.ts
    - apps/web/src/app/features/teams/components/invite-dialog.ts
    - apps/web/src/app/features/teams/components/team-members.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/src/app.module.ts
    - packages/shared-types/src/index.ts
decisions:
  - "Factory pattern for invitation types (EMAIL vs LINK)"
  - "Email invitations: 7-day expiry, single-use, 32-char token"
  - "Link invitations: 30-day expiry, 10 uses max, 16-char URL-safe token"
  - "Using BoardRole enum (OWNER, ADMIN, MEMBER) from Prisma"
  - "TeamMember model with unique constraint on boardId+userId"
metrics:
  duration: ~4min
  completed: 2026-03-15
---

# Phase 3 Plan 4: Team Invitations with Factory Pattern Summary

Team invitation system using Factory pattern to create email or shareable link invitations with different behaviors.

## Factory Pattern Implementation

**Interview talking point:** "I used the Factory pattern for invitations because email and link invitations have different creation logic - different expiration times, usage limits, and token lengths. The factory encapsulates this logic and makes it easy to add new invitation types without modifying existing code."

### InvitationFactory
```typescript
// Factory pattern: Single create() method that produces different invitation configurations
@Injectable()
export class InvitationFactory {
  create(type: InvitationType, data: InvitationData): Prisma.InvitationCreateInput {
    switch (type) {
      case InvitationType.EMAIL:
        return this.createEmailInvitation(data);  // 7-day, single-use
      case InvitationType.LINK:
        return this.createLinkInvitation(data);   // 30-day, 10 uses
    }
  }
}
```

### Invitation Types

| Type  | Expiry  | Max Uses | Token Length | Use Case                    |
|-------|---------|----------|--------------|----------------------------|
| EMAIL | 7 days  | 1        | 32 chars     | Direct invite to specific user |
| LINK  | 30 days | 10       | 16 chars     | Shareable URL invite       |

## Backend Implementation

### Prisma Models
- **BoardRole** enum: OWNER, ADMIN, MEMBER
- **TeamMember**: boardId, userId, role, joinedAt (unique on boardId+userId)
- **Invitation**: type, boardId, inviterId, email?, role, token, expiresAt, maxUses, usedCount

### API Endpoints
- `POST /invitations/email` - Create email invitation (Factory.create(EMAIL))
- `POST /invitations/link` - Create link invitation (Factory.create(LINK))
- `POST /invitations/accept/:token` - Accept and join board
- `GET /invitations/board/:boardId` - List board invitations
- `DELETE /invitations/:id` - Revoke invitation
- `GET /teams/board/:boardId/members` - List team members
- `PATCH /teams/members/:id/role` - Update member role
- `DELETE /teams/members/:id` - Remove member

## Frontend Implementation

### TeamStore (SignalStore)
- Uses `withEntities<TeamMember>()` for member management
- Computed: `membersByRole` groups by OWNER/ADMIN/MEMBER
- RxMethod: loadMembers, inviteByEmail, createInviteLink, updateMemberRole, removeMember

### Components
- **invite-dialog.ts**: Tabs for email/link invitations, clipboard copy for links
- **team-members.ts**: Member list grouped by role, role management, remove functionality

## Commits

| Commit  | Description                                      |
|---------|--------------------------------------------------|
| c8ce914 | Add TeamMember and Invitation models with types  |
| e9bc086 | Implement InvitationFactory and team modules     |
| 83dd559 | Add TeamStore and team UI components             |

## Verification

- [x] Create email invitation - generates token
- [x] Create link invitation - generates shareable URL
- [x] Factory creates different configs for EMAIL vs LINK
- [x] TeamStore manages members with role grouping
- [x] Invite dialog supports both email and link tabs
- [x] Team members list with role management

## Next Phase Readiness

- Factory pattern established for creating different invitation types
- Team infrastructure ready for board access control integration
- Invitation flow ready for email notifications (future enhancement)
