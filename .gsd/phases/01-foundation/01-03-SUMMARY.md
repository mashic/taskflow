---
phase: "01-foundation"
plan: "03"
subsystem: "auth"
tags: ["auth", "jwt", "passport", "nestjs", "security"]

dependency-graph:
  requires: ["01-02"]
  provides: ["JWT authentication", "refresh token rotation", "auth guards"]
  affects: ["02-kanban", "02-real-time"]

tech-stack:
  added: ["@nestjs/passport", "@nestjs/jwt", "passport", "passport-local", "passport-jwt"]
  patterns: ["Passport strategies", "JWT token rotation", "bcrypt hashing"]

key-files:
  created:
    - apps/api/src/auth/auth.module.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
    - apps/api/src/auth/dto/login.dto.ts
    - apps/api/src/auth/dto/register.dto.ts
    - apps/api/src/auth/strategies/local.strategy.ts
    - apps/api/src/auth/strategies/jwt.strategy.ts
    - apps/api/src/auth/strategies/jwt-refresh.strategy.ts
    - apps/api/src/auth/guards/local-auth.guard.ts
    - apps/api/src/auth/guards/jwt-auth.guard.ts
    - apps/api/src/auth/guards/jwt-refresh.guard.ts
    - apps/api/src/auth/auth.service.spec.ts
    - apps/api/jest.config.js
  modified:
    - apps/api/src/app.module.ts
    - apps/api/package.json

decisions:
  - "Refresh tokens hashed with bcrypt before storing"
  - "Access token: 15m expiry, Refresh token: 7d expiry"
  - "ConfigService used for JWT secrets"

metrics:
  duration: "~5 min"
  completed: "2026-03-14"
---

# Phase 01 Plan 03: Auth System Summary

**One-liner:** JWT authentication with Passport strategies, refresh token rotation using bcrypt hashing, and comprehensive unit tests.

## What Was Built

### Auth Strategies
- **LocalStrategy:** Validates email/password credentials via AuthService
- **JwtStrategy:** Extracts and validates JWT from Authorization Bearer header
- **JwtRefreshStrategy:** Validates refresh tokens from request body

### Auth Guards
- **LocalAuthGuard:** Wraps Passport local strategy for login
- **JwtAuthGuard:** Protects routes requiring valid access token
- **JwtRefreshGuard:** Protects refresh endpoint

### AuthService
- `validateUser(email, password)` - Check credentials, return user without sensitive data
- `register(email, password, name?)` - Create user, generate and return tokens
- `login(user)` - Generate tokens for validated user
- `refreshTokens(userId, refreshToken)` - Rotate tokens with hash verification
- `logout(userId)` - Clear refresh token from database
- `generateTokens(userId, email)` - Create access (15m) + refresh (7d) tokens

### AuthController Endpoints
| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | /auth/register | None | Register new user |
| POST | /auth/login | LocalAuthGuard | Login with credentials |
| POST | /auth/refresh | JwtRefreshGuard | Rotate tokens |
| POST | /auth/logout | JwtAuthGuard | Clear session |
| GET | /auth/me | JwtAuthGuard | Get current user |

### Security Features
- Refresh tokens hashed with bcrypt before storing
- Access token short-lived (15m) for security
- Refresh token longer-lived (7d) for UX
- Token rotation on refresh (old refresh invalidated)

## Commits

| Commit | Type | Description |
|--------|------|-------------|
| 31bf22f | feat | Add Passport strategies and auth guards |
| 47858c3 | feat | Add AuthService and AuthController |
| 6587279 | feat | Create AuthModule and integrate with AppModule |
| 315feaf | test | Add AuthService unit tests |

## Verification Results

- [x] TypeScript compiles without errors
- [x] All 10 unit tests pass
- [x] Strategies properly validate credentials/tokens
- [x] Guards protect routes as expected
- [x] Refresh token rotation works with hash verification

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing @types/express**
- **Found during:** Task 1 TypeScript verification
- **Issue:** JWT refresh strategy imports Request from express
- **Fix:** Installed @types/express dev dependency
- **Commit:** Included in 31bf22f

**2. [Rule 3 - Blocking] Jest/TypeScript configuration**
- **Found during:** Task 4 test execution
- **Issue:** Jest couldn't parse TypeScript files
- **Fix:** Installed jest, ts-jest, @nestjs/testing; created jest.config.js
- **Commit:** 315feaf

## Next Phase Readiness

### Dependencies Satisfied
- ✅ UsersService from 01-02 used for user operations
- ✅ PrismaModule available for database operations
- ✅ ConfigModule provides JWT secrets

### Ready For
- Frontend auth integration (02-kanban)
- Protected API routes for boards/tasks
- WebSocket authentication (02-real-time)

### Environment Variables Needed
```env
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
```

Note: Falls back to dev secrets if not provided (for development only).
