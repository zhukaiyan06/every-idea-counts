# AGENTS.md — Every Idea Counts

> Guidance for agentic coding agents. Updated: 2026-03-08

## Project Overview

PWA-first idea capture app with two modes: **Quick Capture** (1 API call) and **Deep Incubation** (3 questions + 1 API call).

**Tech Stack**: React 18 + TypeScript + Vite | Inline styles (no CSS files) | Supabase (Auth + PostgreSQL + RLS + Edge Functions) | GLM/Qwen AI (server-side)

---

## Build/Lint/Test Commands

```bash
# Development
npm ci                        # Clean install dependencies
npm run dev                   # Development server (port 5173)

# Build & Type Check
npm run build                 # Production build (tsc && vite build)
npx tsc --noEmit              # Type check only (faster feedback)

# Linting
npm run lint                  # ESLint with --max-warnings 0

# Unit Tests (Vitest)
npm test                      # Run all unit tests
npm test -- src/domain/text.test.ts    # Run single test file
npm test -- --run             # Run once (no watch)

# E2E Tests (Playwright)
npm run test:e2e              # Requires: supabase start + npm run dev
```

### Supabase Local Development

```bash
supabase start                # Start local stack (Studio: localhost:54323)
supabase stop                 # Stop local stack
supabase status               # View status and local keys
supabase db reset             # Reset database + apply migrations
supabase functions serve      # Run edge functions locally
```

**Local Services**: Studio (54323), API (54321), DB (54322)

---

## Environment Variables

### Frontend (`.env`)
```bash
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key
```

### Edge Functions (`supabase/functions/.env`) — **NEVER COMMIT**
```bash
GLM_API_KEY=your_key
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
DASHSCOPE_API_KEY=your_key
DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

---

## Code Style Guidelines

### Formatting
- **Indent**: 2 spaces
- **Semicolons**: None (project standard)
- **Quotes**: Single quotes for `.ts/.tsx`, double quotes for config files
- **Trailing commas**: None

### Import Order
```typescript
import { useState, useEffect } from 'react'           // 1. React first
import { useNavigate } from 'react-router-dom'        // 2. External libraries
import { supabase } from '../lib/supabase'             // 3. Internal modules
import { createId } from '../lib/createId'            // 3. Internal modules
import type { IdeaRecord } from './types'             // 4. Types last
```

### TypeScript Rules
- **Strict mode**: Enabled in `tsconfig.json`
- **Type-only imports**: Always use `import type { X }`
- **Forbidden**: `any`, `@ts-ignore`, `@ts-expect-error`, `as any`
- **Prefer**: `type` for object shapes, `interface` for extensibility

### Naming Conventions
| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase | `CapturePage.tsx`, `NotePanel.tsx` |
| Utilities | camelCase | `text.ts`, `storage.ts` |
| Constants | SCREAMING_SNAKE_CASE | `ANIMATION`, `DRAFT_KEY` |
| Database fields | snake_case | `idea_type`, `owner_id` |
| Functions | camelCase | `createIdeaLocalFirst()` |

### Error Handling
```typescript
// ✅ Good: Safe fallback
try {
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed : []
} catch {
  return []
}

// ❌ Bad: Empty catch
try { ... } catch { }  // Never do this
```

### Styling Pattern
- **No CSS files or styled-components**
- Use `style` prop with `React.CSSProperties`
- Theme access via `useTheme()` hook from `src/design/`
- Animations via inline `<style>` tags for keyframes

---

## Architecture

### User Flow
```
Quick Mode:    Input → Type → Submit → 1 API call → Note
Deep Mode:     Input → Type → 3 Questions → Submit → 1 API call → Note
Continue:      Note → Chat → Update (append)
```

### Directory Structure
```
src/
├── App.tsx              # Router + root layout
├── components/          # Reusable UI (Layout, note/, capture/)
├── design/              # Theme system (ThemeProvider, useTheme)
├── domain/              # Pure business logic (testable, no deps)
├── hooks/               # Custom React hooks (useSession)
├── lib/                 # External service clients (supabase, createId)
├── pages/               # Route-level page components
└── services/            # Application services (offline/, generateNote)

supabase/
├── functions/           # Edge Functions (Deno runtime)
│   ├── ai_extract_note/ # Note generation from raw input
│   ├── ai_ask/          # Continue digging chat
│   └── _shared/         # Auth, CORS utilities
└── migrations/          # Database schema SQL
```

### Data Model
```typescript
interface IdeaRecord {
  id: string
  owner_id: string
  idea_type: 'product' | 'creative' | 'research'
  title: string
  raw_input: string
  status: 'draft' | 'incubating' | 'completed' | 'archived'
  capture_mode?: 'quick' | 'deep'
  deep_answers?: { q1: string; q2: string; q3: string }
  final_note?: string | null
  created_at: string
  updated_at: string
}
```

---

## Testing

### Unit Tests (Vitest)
- Place `*.test.ts` next to source files
- Focus on `src/domain/` for pure functions
- Import from `vitest`: `describe`, `it`, `expect`

### E2E Tests (Playwright)
- Located in `e2e/` directory
- Prerequisites: `supabase start` + `npm run dev`
- Base URL: `http://127.0.0.1:4173`

---

## Deployment

```bash
# 1. Link to remote project
supabase link --project-ref <ref>

# 2. Push database migrations
supabase db push

# 3. Set secrets (create supabase/.env.production first)
supabase secrets set --env-file ./supabase/.env.production

# 4. Deploy Edge Functions
supabase functions deploy ai_extract_note
supabase functions deploy ai_ask

# 5. Frontend: deploy dist/ to Vercel/Netlify
```

**Multi-User Ready**: RLS ensures data isolation. Each user sees only their own ideas.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `npm run build` fails | Run `npx tsc --noEmit` to see TypeScript errors |
| E2E tests fail | Ensure `supabase start` is running |
| Auth errors | Check `.env` has correct URL and anon key |
| Offline sync issues | Check localStorage key `unsynced-ideas` |
| AI generation fails | Verify GLM/DASHSCOPE keys in edge function env |

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Two-Mode Design | `docs/design/two-mode-capture.md` |
| MVP Plan | `docs/plans/2026-03-05-every-idea-counts-pwa-mvp.md` |
| Product Spec | `docs/spec/unified-spec.md` |
| Database Schema | `supabase/migrations/*.sql` |
| Theme System | `src/design/theme.ts`, `src/design/index.ts` |
| Offline Service | `src/services/offline/index.ts` |