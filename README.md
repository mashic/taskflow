# TaskFlow

Real-time Kanban collaboration platform built with Angular 21 + NestJS.

## 🎯 Purpose

Portfolio project demonstrating modern full-stack development with:
- **Angular 21**: Signals, standalone components, SignalStore, zoneless-ready
- **NestJS**: Clean architecture, Prisma ORM, WebSocket real-time
- **TDD**: Vitest + Playwright, 80%+ coverage target
- **12+ Design Patterns**: Repository, Factory, Strategy, Observer, Decorator, Facade...

## 📦 Monorepo Structure

```
taskflow/
├── apps/
│   ├── web/          # Angular 21 SPA
│   └── api/          # NestJS API
├── packages/
│   ├── shared-types/ # TypeScript interfaces
│   └── eslint-config/# Shared ESLint rules
├── docs/             # Documentation
└── .gsd/             # GSD project context (Get Stuff Done)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- Docker (for PostgreSQL)

### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL (Docker)
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm dev:web` | Start Angular app only |
| `pnpm dev:api` | Start NestJS app only |
| `pnpm build` | Build all apps |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm e2e` | Run Playwright E2E tests |
| `pnpm db:studio` | Open Prisma Studio |

## 🛠️ Tech Stack

### Frontend
- Angular 21 (standalone components, signals)
- NgRx SignalStore
- Angular Material / Tailwind
- Vitest + Playwright

### Backend
- NestJS 10
- Prisma + PostgreSQL
- Socket.io (real-time)
- Passport.js (JWT auth)

## 📋 GSD Workflow

This project uses the [Get Stuff Done](https://github.com/Punal100/get-stuff-done-for-github-copilot) system for structured development.

See `.gsd/` for:
- `PROJECT.md` — Vision and requirements
- `STATE.md` — Current progress
- `ROADMAP.md` — Phase structure
- `REQUIREMENTS.md` — Detailed specs

## 📄 License

MIT
