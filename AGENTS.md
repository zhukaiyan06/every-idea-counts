# AGENTS.md — Every Idea Counts (v2.0 两模式版)

> This document provides guidance for agentic coding agents working in this repository.

## Project Overview

A PWA-first idea capture app with two modes: Quick Capture (1 API call) and Deep Incubation (3 questions + 1 API call).

**Core Principles:**
- **Simple**: Lower barrier, default to "Quick Capture", one-click note generation
- **Fast**: Minimize API calls, both quick and deep modes require only 1 API call

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Styling: Inline styles (no CSS framework)
- State: Zustand + localStorage for offline
- Backend: Supabase (Auth + PostgreSQL + RLS + Edge Functions)
- AI Providers: 智谱AI (GLM) / 通义千问 (Qwen) — server-side only

## Key Changes from v1.0

| Feature | v1.0 | v2.0 |
|---------|------|------|
| Capture Mode | Forced 5-stage incubation | Quick (default) / Deep (optional) |
| API Calls | 10+ calls | 1 call |
| Deep Questions | AI-generated via router | Frontend static, 3 questions |
| State Machine | 5 stages with transitions | Removed |
| ai_router | Required | Deprecated |

## Build/Lint/Test Commands

```bash
# Install dependencies
npm ci

# Development server (port 5173)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Run unit tests (Vitest)
npm test

# Run single test file
npm test -- src/domain/text.test.ts

# Run tests in watch mode
npm test -- --watch

# Run E2E tests (Playwright) — requires Supabase local running
npm run test:e2e

# Run linting
npm run lint

# Type check only
npx tsc --noEmit
```

## Supabase Local Development

Prerequisites: Docker Desktop running, Supabase CLI installed.

```bash
# Initialize (first time only)
supabase init

# Start local stack (Studio: http://localhost:54323)
supabase start

# Stop local stack
supabase stop

# View status and get local keys
supabase status

# Reset database (applies migrations fresh)
supabase db reset

# Deploy edge function locally
supabase functions serve
```

Local services:
- Studio: http://localhost:54323
- API: http://localhost:54321
- DB: postgresql://postgres:postgres@localhost:54322/postgres

## Environment Variables

### Frontend (.env or .env.local)

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ALLOWED_EMAIL=your_authorized_email
```

### Edge Functions (supabase/functions/.env)

**NEVER commit this file.** Required secrets:

```bash
ALLOWED_EMAIL=your_authorized_email
GLM_API_KEY=your_glm_api_key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
DASHSCOPE_API_KEY=your_dashscope_api_key
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

## Code Style Guidelines

### Imports

- Use relative imports for clarity
- Group imports: React → external libs → internal modules → types
- Use `import type` for type-only imports
- Example:
  ```typescript
  import { useState, useEffect } from "react"
  import { useNavigate } from "react-router-dom"
  import { supabase } from "../lib/supabase"
  import type { IdeaRecord, IdeaType } from "../services/offline"
  ```

### Formatting

- Indent: 2 spaces
- Semicolons: none (project style)
- Quotes: double quotes for all strings
- Trailing commas: none
- Arrow functions: use `const fn = () => {}` for top-level, inline for callbacks

### TypeScript

- Strict mode enabled (`strict: true` in tsconfig.json)
- Prefer explicit types for function parameters and return values
- Use `type` for object shapes, `interface` for extensibility
- Avoid `any`; use `unknown` with type guards if needed
- Never use `@ts-ignore`, `@ts-expect-error`, or `as any`
- Use type-only imports: `import type { X } from "./module"`

### Naming Conventions

- Components: PascalCase files and exports (`CapturePage.tsx`, `Layout.tsx`)
- Utilities: camelCase files (`incubation.ts`, `text.ts`)
- Constants: SCREAMING_SNAKE_CASE for true constants (`STAGE_ORDER`, `DRAFT_KEY`)
- Database types: match table/column names (`idea_type`, `raw_input`)
- CSS: inline styles only (no CSS files, no Tailwind)

### Error Handling

- Always handle errors explicitly; no empty catch blocks
- Use typed error responses from Edge Functions
- Display user-friendly error messages in Chinese (app locale)
- Log errors to console in development only

### File Structure (v2.0)

```
src/
├── App.tsx              # Router + root component
├── main.tsx             # Entry point
├── vite-env.d.ts        # Vite type declarations
├── components/          # Reusable UI components
│   ├── Layout.tsx
│   ├── note/            # Note panel components
│   └── capture/         # NEW: Capture mode components
│       ├── QuickModeForm.tsx
│       └── DeepModeQuestions.tsx
├── domain/              # Pure business logic (testable)
│   ├── text.ts          # Text utilities
│   └── text.test.ts
├── hooks/               # Custom React hooks
│   └── useSession.ts
├── lib/                 # External service clients
│   └── supabase.ts
├── pages/               # Route-level page components
│   ├── CapturePage.tsx  # MODIFIED: Two-mode UI
│   ├── IdeaDetailPage.tsx
│   ├── LibraryPage.tsx
│   ├── WeeklyReviewPage.tsx
│   └── SettingsPage.tsx
└── services/            # Application services
    ├── settings.ts
    └── offline/         # Offline sync logic
        ├── index.ts
        ├── storage.ts
        ├── sync.ts
        ├── queue.ts
        └── types.ts
```

## Architecture Notes (v2.0)

### Two Capture Modes

```
Quick Capture (default):
  Input → Type → Submit → 1 API call → Note displayed

Deep Incubation:
  Input → Type → 3 Questions (frontend static) → Submit → 1 API call → Note displayed

Continue Digging:
  Note displayed → Click button → Free chat → Update note (append)
```

### Type-Specific Questions (Deep Mode)

**Product:**
- Q1: 这个想法为哪些用户解决什么问题？
- Q2: 用户在什么场景下会使用？
- Q3: 他们现在怎么解决这个问题？

**Creative:**
- Q1: 主题或核心信息是什么？
- Q2: 目标受众是谁？为什么感兴趣？
- Q3: 有什么参考作品或灵感来源？

**Research:**
- Q1: 想探索或验证什么问题？
- Q2: 打算用什么方法研究？
- Q3: 已有相关研究有哪些？

### Edge Functions (v2.0)

**Active:**
- `ai_extract_note` — Generates Markdown note (supports quick/deep modes)
- `ai_ask` — Continue Digging mode (free-form Q&A)

**Deprecated:**
- `ai_router` — No longer needed, deep mode questions are frontend static

### Single-User Gate

MVP enforces single-user access via:
1. `VITE_ALLOWED_EMAIL` — UI-level check after login
2. `ALLOWED_EMAIL` secret — Edge Function allowlist verification
3. RLS policies — Database-level isolation by `owner_id = auth.uid()`

### Offline Strategy (MVP)

- Local storage for drafts and unsynced ideas
- Background sync queue with Last-Write-Wins conflict resolution
- No conflict UI for single-user MVP
- Key: `unsynced-ideas` in localStorage

### PWA Configuration

- Configured in `vite.config.ts` via `vite-plugin-pwa`
- Manifest: name "Every Idea Counts", short_name "EIC"
- Start URL: `/capture`
- Auto-update registration
- Workbox excludes `/supabase` routes from caching

## Data Model (v2.0)

### IdeaRecord

```typescript
interface IdeaRecord {
  id: string
  owner_id: string
  idea_type: 'product' | 'creative' | 'research'
  title: string
  raw_input: string
  status: 'draft' | 'incubating' | 'completed' | 'archived'
  
  // v2.0 new fields
  capture_mode?: 'quick' | 'deep'
  deep_answers?: {
    q1: string
    q2: string
    q3: string
  }
  
  // Note
  final_note?: string | null
  
  // v1 compatibility (deprecated but kept)
  current_state?: string | null
  turn_count_in_state?: number | null
  collected?: Record<string, string> | null
  
  // Timestamps
  created_at: string
  updated_at: string
}
```

## API Parameters (v2.0)

### ai_extract_note Request

```typescript
interface ExtractNoteRequest {
  idea_id: string
  idea_type: 'product' | 'creative' | 'research'
  raw_input: string
  timestamp: string
  
  // v2.0 new
  capture_mode: 'quick' | 'deep'
  deep_answers?: {
    q1: string
    q2: string
    q3: string
  }
}
```

## Testing Guidelines

### Unit Tests (Vitest)

- Place test files next to source: `text.test.ts`
- Test pure functions in `src/domain/`
- Import from `vitest`: `import { describe, expect, it } from 'vitest'`

### E2E Tests (Playwright)

- Located in `e2e/` directory
- Config: `playwright.config.ts` (Chromium only, single worker)
- Requires running: `supabase start` + `npm run dev`
- Base URL: `http://127.0.0.1:4173`

## Key Files Reference

| Purpose | File |
|---------|------|
| Two-Mode Design | `docs/design/two-mode-capture.md` |
| MVP Plan | `docs/plans/2026-03-05-every-idea-counts-pwa-mvp.md` |
| Product Spec | `docs/spec/unified-spec.md` |
| Interaction Spec | `docs/spec/interaction-spec.md` |
| Database Schema | `supabase/migrations/20260305195446_add_ideas_schema.sql` |
| PWA Config | `vite.config.ts` |
| ESLint Config | `.eslintrc.cjs` |

## Deprecated Components (v1.0)

The following are no longer actively used but kept for backward compatibility:

- `src/components/incubation/IncubationPanel.tsx`
- `src/domain/incubation.ts` (state machine logic)
- `supabase/functions/ai_router/`

## Deployment

See README.md for Supabase remote deployment runbook.

Required secrets for production:
- `ALLOWED_EMAIL`
- `GLM_API_KEY`, `GLM_BASE_URL`
- `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`

Deployment commands:
```bash
supabase link --project-ref <ref>
supabase db push
supabase secrets set --env-file ./supabase/.env.production
supabase functions deploy ai_extract_note
supabase functions deploy ai_ask
```