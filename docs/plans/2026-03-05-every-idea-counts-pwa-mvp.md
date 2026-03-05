# Every Idea Counts (PWA) — MVP Implementation Plan

## TL;DR
> **Summary**: Build a PWA-first idea capture + AI incubation app that turns one-line ideas into structured, actionable Markdown notes via a state-machine guided coach.
> **Deliverables**: PWA UI (Capture/Library/Review/Idea Detail/Settings) + Supabase (Auth+Postgres+RLS) + Edge Functions AI proxy (GLM/Qwen) + Markdown note generation/export + basic tests.
> **Effort**: Large
> **Parallel**: YES — 4 waves
> **Critical Path**: Supabase schema/RLS → Auth (single user) → Edge Functions AI proxy → Incubation flow UI/state machine → Note generation/export → Weekly review

## Context
### Original Request
- Idea-capture app concept: “every idea counts”, solve “ideas get forgotten because they are not concretized”.
- Core loop: capture idea → AI incubates via guided Q&A → summarize into note → saved in library.
- Merge two drafts into one spec and iterate interaction.

### Interview Summary (decisions locked)
- MVP platform: Web-first PWA
- Audience: single user (you)
- AI cost: use your own single API key (server-side only)
- Capture entry: PWA only (in-app shortcut + homepage entry); no browser extension; no desktop shell
- Idea types: user selects at capture: `product|creative|research`
- Incubation sessions: default single-stage per session (1 question + max 1 follow-up); user chooses `Continue`
- Editor: Markdown + live preview
- Note re-generation: append to end (never overwrite)
- Review: weekly review view; default sort “stuck longest” (oldest `updated_at`)
- Ask AI (user proactive questions): MVP must-have
- Sync: Last-Write-Wins by `updated_at`
- Notion: MVP supports Markdown/HTML export for manual import; no Notion API

### Defaults Applied (not explicitly chosen, but required to be decision-complete)
- Auth method (MVP): email+password (enables automated Playwright; magic link is a later enhancement)
- Offline sync: background sync queue with no conflict UI (acceptable for single-user MVP)
- Default models:
  - GLM (Z.ai): `glm-4.6`
  - Qwen (DashScope): `qwen-plus`

### Source Specs (single truth)
- Unified spec: `.sisyphus/drafts/every-idea-counts-unified-spec.md`
- IA + screens: `.sisyphus/drafts/every-idea-counts-ia-and-screens.md`
- Interaction spec: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`

### Metis Review (gaps addressed)
- Filled gaps Metis/Oracle flagged:
  - Lock offline contract (MVP): offline = local draft + local idea/note edits persisted locally; sync happens when back online; no conflict UI; LWW by server `updated_at`.
  - Add missing incubation state persistence (not just `ai_conversation`): store `current_state`, `turn_count_in_state`, `collected`.
  - Enforce single-user at 2 layers: UI gate + Edge Function allowlist (email); do not rely on “hidden URL”.
  - Remove “manual QA” requirement; replace with scripted Playwright + curl/smoke checks.
  - Add DB `updated_at` trigger so “stuck-longest” ordering is correct.
  - Add Markdown sanitization for preview + exported HTML.
  - Server-side validation for AI outputs (JSON schema, one-question rule) to prevent UX breakage.

## Work Objectives
### Core Objective
Deliver a PWA MVP that makes “capture → 1-step incubation → actionable note → weekly review” feel fast and repeatable, with stable AI behavior (no rambling; no multi-question prompts).

### Deliverables
- PWA app with routes: `/capture`, `/library`, `/review`, `/idea/:id`, `/settings`, `/login` (if needed)
- Supabase: `ideas` + `idea_messages` tables + RLS + single-user auth constraints
- Edge Functions:
  - `ai_router`: returns next question (FOLLOW_UP/ADVANCE) per state machine
  - `ai_ask`: Ask AI mode (side Q&A; read-only to stage)
  - `ai_extract_note`: outputs the Markdown template note
- Incubation UI:
  - Stage card with goal line + single question
  - `Answer/Ask AI` toggle
  - `Send`, `Skip`, `Generate Note`, `Continue` flows with strict enable/disable rules
- Notes:
  - Markdown editor + live preview
  - Export `.md` and `.html`
- Weekly Review:
  - stuck-longest ordering
  - quick actions: Continue 1 Step / Generate Note / Archive

### Definition of Done (agent-executable)
- `npm ci && npm run build` succeeds
- `npm run dev` runs and critical flows pass via Playwright E2E
- Supabase local: `supabase start` + migrations apply without errors
- RLS verified: cannot access ideas from another user (test via service role bypass NOT allowed in app runtime)
- AI proxy verified: API key never appears in client bundle; all AI calls go through Edge Functions

## External References (authoritative)
- Supabase Edge Functions quickstart/invoke: https://supabase.com/docs/guides/functions/quickstart
- Supabase Functions CORS: https://supabase.com/docs/guides/functions/cors
- Supabase Functions secrets: https://supabase.com/docs/guides/functions/secrets
- Supabase Functions development tips: https://supabase.com/docs/guides/functions/development-tips
- Supabase Functions auth (forward Authorization header, RLS-in-function pattern): https://supabase.com/docs/guides/functions/auth-legacy-jwt
- Z.ai (GLM) API intro: https://docs.z.ai/api-reference/introduction
- Z.ai chat completions: https://docs.z.ai/api-reference/llm/chat-completion
- Z.ai structured output: https://docs.z.ai/guides/capabilities/struct-output
- Z.ai errors/codes: https://docs.z.ai/api-reference/api-code
- DashScope OpenAI-compat overview: https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope
- DashScope chat completions reference: https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions
- DashScope structured output: https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output
- DashScope error codes: https://www.alibabacloud.com/help/en/model-studio/error-code

### Must Have
- Ask AI mode in incubation (MVP)
- Single-stage default incubation, with user-controlled Continue
- Never ask multiple questions in a single AI response
- Note generation always yields at least 2 action items (one 15-min, one research/validation)

### Must NOT Have (guardrails)
- No exposing AI provider keys to frontend
- No “chat app” UI (avoid long conversation scroll; collapse previous stages)
- No multi-user / billing / Notion OAuth
- No rich-text editor (Markdown only)

## Verification Strategy
> ZERO HUMAN INTERVENTION — all verification is agent-executed.
- Tests-after (not TDD): add unit tests for pure logic + Playwright E2E for main flows
- Evidence folder: `.sisyphus/evidence/` artifacts per task (screenshots, logs)

## Execution Strategy
### Parallel Execution Waves

Wave 1 (Project foundation)
- Scaffold PWA repo (Vite React TS) + lint/format + routing + Tailwind + Zustand
- Supabase project scaffolding (CLI) + initial schema/migrations + RLS + auth constraints

Wave 2 (AI proxy + core domain)
- Edge Functions for AI router + note extraction + provider abstraction (GLM/Qwen)
- Domain types + state machine logic + prompt templates (per unified spec)

Wave 3 (Core UI)
- Capture page + local draft cache
- Idea Detail: incubation panel (Answer/Ask AI) + note panel (editor/preview/export)
- Library page (filters/search/sort)

Wave 4 (Review + hardening)
- Weekly Review page + quick actions
- Offline/timeout/error handling polish
- E2E + build verification

### Dependency Matrix (high level)
- Supabase schema/RLS blocks: app data layer + E2E
- Edge Functions blocks: incubation + note generation
- Routing/layout blocks: all UI pages

## TODOs
> Implementation + Test = ONE task.
> EVERY task includes QA scenarios.

- [ ] 1. Create repo workspace + baseline toolchain

  **What to do**:
  - Create a new repo directory: `~/my_workspace/every-idea-counts/`
  - Initialize git.
  - Create repo docs folders:
    - `docs/spec/` (product + UX + prompts)
    - `docs/plans/` (implementation plans)
  - Copy the finalized specs into the repo (so the project is self-contained):
    - From `/Users/zhukaiyan/.sisyphus/drafts/every-idea-counts-unified-spec.md` → `docs/spec/unified-spec.md`
    - From `/Users/zhukaiyan/.sisyphus/drafts/every-idea-counts-ia-and-screens.md` → `docs/spec/ia-and-screens.md`
    - From `/Users/zhukaiyan/.sisyphus/drafts/every-idea-counts-interaction-spec.md` → `docs/spec/interaction-spec.md`
    - From `/Users/zhukaiyan/.sisyphus/plans/2026-03-05-every-idea-counts-pwa-mvp.md` → `docs/plans/2026-03-05-every-idea-counts-pwa-mvp.md`
  - Create a Vite React TS app at repo root (no monorepo).
  - Add core deps: `react-router-dom`, `zustand`, `@supabase/supabase-js`, `uuid`.
  - Add Markdown preview + sanitization deps:
    - `react-markdown`, `remark-gfm`, `rehype-sanitize`
  - Add PWA support: `vite-plugin-pwa`.
  - Add testing deps:
    - Unit: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
    - E2E: `@playwright/test`
  - Add scripts in `package.json`: `dev`, `build`, `preview`, `test`, `test:e2e`, `lint` (eslint).

  **Must NOT do**:
  - Do not commit any `.env*` with secrets.

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: straightforward scaffolding.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 2-24 | Blocked By: none

  **References**:
  - Specs: `.sisyphus/drafts/every-idea-counts-ia-and-screens.md`

  **Acceptance Criteria**:
  - [ ] `npm ci` succeeds
  - [ ] `npm run dev` starts
  - [ ] `npm run build` succeeds
  - [ ] Repo contains `docs/spec/unified-spec.md`
  - [ ] Repo contains `docs/spec/ia-and-screens.md`
  - [ ] Repo contains `docs/spec/interaction-spec.md`
  - [ ] Repo contains `docs/plans/2026-03-05-every-idea-counts-pwa-mvp.md`

  **QA Scenarios**:
  ```
  Scenario: App boots
    Tool: Bash
    Steps: npm run dev
    Expected: dev server reachable; blank app renders without console errors
    Evidence: .sisyphus/evidence/task-1-app-boots.txt
  ```

  **Commit**: YES | Message: `chore: scaffold vite pwa app` | Files: [repo baseline]

- [ ] 2. Implement app routing + page shells (Chinese UI)

  **What to do**:
  - Create pages:
    - `src/pages/CapturePage.tsx`
    - `src/pages/LibraryPage.tsx`
    - `src/pages/WeeklyReviewPage.tsx`
    - `src/pages/IdeaDetailPage.tsx`
    - `src/pages/SettingsPage.tsx`
    - `src/pages/LoginPage.tsx`
  - Create layout + navigation:
    - `src/components/Layout.tsx`
  - Set up router in `src/App.tsx` with the routes from IA spec.
  - Default route `/` redirects to `/capture`.

  **Must NOT do**:
  - Do not implement business logic yet; only shells + navigation.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` — Reason: navigation + layout.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 11-20 | Blocked By: 1

  **References**:
  - IA: `.sisyphus/drafts/every-idea-counts-ia-and-screens.md`
  - Interaction: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`

  **Acceptance Criteria**:
  - [ ] Visiting each route renders its page title and primary CTA

  **QA Scenarios**:
  ```
  Scenario: Navigate across main tabs
    Tool: Playwright
    Steps: open /capture; click Library; click Weekly Review; click Settings
    Expected: route changes; no crash
    Evidence: .sisyphus/evidence/task-2-routing.webm
  ```

  **Commit**: YES | Message: `feat: add page shells and routing` | Files: `src/App.tsx`, `src/pages/*`, `src/components/Layout.tsx`

- [ ] 3. Add PWA manifest + service worker (minimal)

  **What to do**:
  - Configure `vite-plugin-pwa` in `vite.config.ts`.
  - Add manifest fields: name, short_name, start_url `/capture`, display `standalone`, theme/background colors.
  - Add placeholder icons under `public/`.
  - Cache static assets; do not attempt offline API caching.

  **Must NOT do**:
  - Do not cache Supabase API responses; avoid stale auth issues.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: none | Blocked By: 1

  **Acceptance Criteria**:
  - [ ] Lighthouse PWA installability checks pass (basic)

  **QA Scenarios**:
  ```
  Scenario: Installable PWA
    Tool: Playwright
    Steps: open app; verify manifest link and SW registration
    Expected: service worker registered; manifest served
    Evidence: .sisyphus/evidence/task-3-pwa.txt
  ```

  **Commit**: YES | Message: `feat: add pwa manifest and service worker` | Files: `vite.config.ts`, `public/*`

- [ ] 4. Initialize Supabase (local dev) + migrations folder

  **What to do**:
  - Install Supabase CLI (doc-driven) and run `supabase init` in repo.
  - Ensure local stack works: `supabase start`.
  - Document local commands in `README.md`.

  **Must NOT do**:
  - Do not paste project keys in docs.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: infra + CLI + local env.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5-10, 18-20 | Blocked By: 1

  **References**:
  - Supabase functions quickstart: https://supabase.com/docs/guides/functions/quickstart

  **Acceptance Criteria**:
  - [ ] `supabase start` succeeds
  - [ ] Local Studio reachable

  **QA Scenarios**:
  ```
  Scenario: Supabase local starts
    Tool: Bash
    Steps: supabase start
    Expected: all services healthy
    Evidence: .sisyphus/evidence/task-4-supabase-start.txt
  ```

  **Commit**: YES | Message: `chore: init supabase local project` | Files: `supabase/**`, `README.md`

- [ ] 5. Database schema: ideas + idea_messages + triggers + indexes + RLS

  **What to do**:
  - Add a migration in `supabase/migrations/` that creates:
    - `ideas` table:
      - `id uuid pk` (client may provide)
      - `owner_id uuid not null default auth.uid()`
      - `idea_type text check in ('product','creative','research')`
      - `title text not null` (client sets; default derived from raw_input)
      - `raw_input text not null`
      - `status text check in ('draft','incubating','completed','archived')`
      - incubation fields: `current_state`, `turn_count_in_state`, `collected jsonb` (per unified spec appendix)
      - `final_note text` (may be null)
      - timestamps: `created_at`, `updated_at`
    - `idea_messages` table (append-only log):
      - `id uuid pk`, `idea_id fk`, `owner_id default auth.uid()`, `mode ('incubate','ask')`, `role ('user','assistant','system')`, `content text`, `created_at`
  - Add `updated_at` trigger function and triggers for `ideas`.
  - Enable RLS on both tables.
  - Policies (TO authenticated): `owner_id = auth.uid()` for select/insert/update/delete.
  - Add indexes:
    - `ideas(owner_id, updated_at)`
    - `ideas(owner_id, status, updated_at)`
    - `idea_messages(idea_id, created_at)`

  **Must NOT do**:
  - Do not use service role from the browser.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: SQL/RLS correctness matters.
  - Skills: []

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 6-24 | Blocked By: 4

  **References**:
  - Unified spec (ideas schema baseline + incubation state): `.sisyphus/drafts/every-idea-counts-unified-spec.md`
  - Oracle RLS guidance (owner_id + policies): bg_7e99d9d6 output

  **Acceptance Criteria**:
  - [ ] `supabase db reset` succeeds
  - [ ] RLS enabled on `ideas` and `idea_messages`

  **QA Scenarios**:
  ```
  Scenario: RLS blocks cross-user reads
    Tool: Bash
    Steps: run node script that creates user A/B, inserts as A, selects as B
    Expected: B cannot read A's rows
    Evidence: .sisyphus/evidence/task-5-rls-smoke.txt
  ```

  **Commit**: YES | Message: `feat: add ideas schema, messages log, and rls` | Files: `supabase/migrations/*`

- [ ] 6. Frontend Supabase client + single-user gate

  **What to do**:
  - Add `src/lib/supabase.ts` creating client from `import.meta.env.VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  - Add auth session hook `src/hooks/useSession.ts`.
  - Implement `LoginPage` with email/password.
  - Enforce allowlist in UI:
    - `VITE_ALLOWED_EMAIL`.
    - After login, if session user email != allowed, sign out and show `Unauthorized`.
  - Route guard: unauthenticated redirects to `/login`.

  **Must NOT do**:
  - Do not put AI keys in any `VITE_*` env.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: auth flow correctness.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 11-20 | Blocked By: 2,5

  **References**:
  - Oracle: enforce allowlist at multiple layers: bg_7e99d9d6

  **Acceptance Criteria**:
  - [ ] Unauthed access redirects to /login
  - [ ] Allowed email can log in and reach /capture
  - [ ] Non-allowed email is signed out and blocked

  **QA Scenarios**:
  ```
  Scenario: Unauthorized email blocked
    Tool: Playwright
    Steps: sign in as non-allowed user
    Expected: sees Unauthorized and is signed out
    Evidence: .sisyphus/evidence/task-6-unauthorized.png
  ```

  **Commit**: YES | Message: `feat: add supabase auth and single-user gate` | Files: `src/lib/supabase.ts`, `src/pages/LoginPage.tsx`, guards

- [ ] 7. Edge Functions: shared utilities (CORS + auth + allowlist)

  **What to do**:
  - Create functions:
    - `supabase/functions/_shared/cors.ts`
    - `supabase/functions/_shared/auth.ts`
    - `supabase/functions/_shared/allowlist.ts`
  - Implement:
    - CORS preflight handling + always-return CORS headers (success + error).
    - JWT requirement: missing/invalid Authorization returns 401.
    - Allowlist: compare user email (from verified token/user) to `ALLOWED_EMAIL` secret; if mismatch return 403.
  - Add local secrets file (NOT committed): `supabase/functions/.env` with:
    - `ALLOWED_EMAIL=you@example.com`
    - `ZAI_API_KEY=...`
    - `ZAI_BASE_URL=https://api.z.ai/api/paas/v4`
    - `DASHSCOPE_API_KEY=...`
    - `DASHSCOPE_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1`

  **Must NOT do**:
  - Never log Authorization headers or provider keys.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: security boundary.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8-10 | Blocked By: 4,5

  **References**:
  - CORS: https://supabase.com/docs/guides/functions/cors
  - Secrets: https://supabase.com/docs/guides/functions/secrets
  - Auth pattern: https://supabase.com/docs/guides/functions/auth-legacy-jwt

  **Acceptance Criteria**:
  - [ ] `supabase functions serve` for a hello function responds with CORS headers

  **QA Scenarios**:
  ```
  Scenario: Preflight succeeds
    Tool: Bash
    Steps: curl -i -X OPTIONS http://localhost:54321/functions/v1/ai_router -H 'Origin: http://localhost:5173'
    Expected: 200/204 with Access-Control-Allow-* headers
    Evidence: .sisyphus/evidence/task-7-cors.txt
  ```

  **Commit**: YES | Message: `feat: add edge function cors/auth/allowlist helpers` | Files: `supabase/functions/_shared/*`

- [ ] 8. Edge Function: `ai_router` (incubation routing)

  **What to do**:
  - Create `supabase/functions/ai_router/index.ts`.
  - Request body JSON must include: `idea_id`, `idea_type`, `current_state`, `current_state_goal`, `current_step_index`, `turn_count_in_state`, `raw_input`, `user_latest_reply`.
  - Server responsibilities:
    - Verify JWT + allowlist.
    - Validate input sizes.
    - Call provider chat endpoint (GLM or Qwen) using secrets.
      - GLM (Z.ai): `POST {ZAI_BASE_URL}/chat/completions` with `model=glm-4.6` by default.
      - Qwen (DashScope): `POST {DASHSCOPE_BASE_URL}/chat/completions` with `model=qwen-plus` by default.
      - Always use non-streaming mode for MVP (`stream: false`).
    - Enforce strict JSON response: `{ action: "FOLLOW_UP"|"ADVANCE", question: string }`.
    - Enforce one-question rule: question contains exactly one `?` (Chinese punctuation `？` normalized to `?`).
    - Persist to DB:
      - Append to `idea_messages` with mode `incubate`.
  - Return JSON to client.

  **Must NOT do**:
  - Must not accept `owner_id`/`uid` from request body.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 14 | Blocked By: 7

  **References**:
  - Z.ai chat: https://docs.z.ai/api-reference/llm/chat-completion
  - Qwen chat: https://www.alibabacloud.com/help/en/model-studio/qwen-api-via-openai-chat-completions

  **Acceptance Criteria**:
  - [ ] `curl` without auth returns 401
  - [ ] `curl` with wrong email returns 403
  - [ ] `curl` with allowed JWT returns JSON with `action` and `question`

  **QA Scenarios**:
  ```
  Scenario: Router returns one-question JSON
    Tool: Bash
    Steps: curl -s -H "Authorization: Bearer $JWT_ALLOWED" -H 'Content-Type: application/json' \
      -d '{"idea_id":"...","idea_type":"product","current_state":"problem_definition","current_state_goal":"...","current_step_index":1,"turn_count_in_state":0,"raw_input":"...","user_latest_reply":"..."}' \
      http://localhost:54321/functions/v1/ai_router | jq -e '.action and .question'
    Expected: action in [FOLLOW_UP,ADVANCE]; question contains exactly one '?' character
    Evidence: .sisyphus/evidence/task-8-router.json
  ```

  **Commit**: YES | Message: `feat: add ai_router edge function` | Files: `supabase/functions/ai_router/*`

- [ ] 9. Edge Function: `ai_ask` (Ask AI side Q&A)

  **What to do**:
  - Create `supabase/functions/ai_ask/index.ts`.
  - Input: `{ idea_id, current_state, current_state_goal, idea_type, raw_input, user_question }`.
  - Output: `{ answer: string }`.
  - Enforce answer constraints:
    - Max 3 sentences
    - No question marks in output (no counter-questions)
  - Always call provider in non-streaming mode (`stream: false`).
  - Persist to `idea_messages` with mode `ask`.

  **Must NOT do**:
  - Must not write `ideas.current_state` or `collected`.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 14 | Blocked By: 7

  **References**:
  - Ask AI spec: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`

  **Acceptance Criteria**:
  - [ ] Endpoint returns `answer` and does not change stage in DB

  **QA Scenarios**:
  ```
  Scenario: Ask AI does not advance
    Tool: Bash
    Steps: call ai_ask; then query ideas row current_state
    Expected: current_state unchanged
    Evidence: .sisyphus/evidence/task-9-ask-no-advance.txt
  ```

  **Commit**: YES | Message: `feat: add ai_ask edge function` | Files: `supabase/functions/ai_ask/*`

- [ ] 10. Edge Function: `ai_extract_note` (Markdown note generation)

  **What to do**:
  - Create `supabase/functions/ai_extract_note/index.ts`.
  - Input: `{ idea_id, idea_type, raw_input, collected, timestamp }`.
  - Output: `{ markdown: string }`.
  - Prompt must enforce:
    - Fixed Markdown template from unified spec
    - At least 2 action items (first <=15min, second research/validation)
  - On success, append to `ideas.final_note` with delimiter:
    - `---\nAI draft (YYYY-MM-DD HH:mm)\n` + generated note content
  - Persist generation as an assistant message in `idea_messages` (mode incubate).
  - Provider call defaults:
    - GLM: `model=glm-4.6`, `stream:false`
    - Qwen: `model=qwen-plus`, `stream:false`

  **Must NOT do**:
  - Do not overwrite `final_note`.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 15 | Blocked By: 7

  **References**:
  - Prompt appendix: `.sisyphus/drafts/every-idea-counts-unified-spec.md`
  - Z.ai structured output (optional): https://docs.z.ai/guides/capabilities/struct-output
  - Qwen structured output: https://www.alibabacloud.com/help/en/model-studio/qwen-structured-output

  **Acceptance Criteria**:
  - [ ] Two consecutive calls append twice to `final_note`

  **QA Scenarios**:
  ```
  Scenario: Append-only note generation
    Tool: Bash
    Steps: call ai_extract_note twice; fetch ideas.final_note
    Expected: contains two 'AI draft (' markers; earlier text preserved
    Evidence: .sisyphus/evidence/task-10-append.txt
  ```

  **Commit**: YES | Message: `feat: add ai_extract_note edge function` | Files: `supabase/functions/ai_extract_note/*`

- [ ] 11. Capture page implementation (type selector + draft cache + actions)

  **What to do**:
  - Implement Capture UI per interaction spec:
    - type selector (product/creative/research)
    - textarea with per-type placeholder
    - helper text
    - `Capture & Start` and `Just Capture`
  - Implement local draft save (localStorage) debounce 1-2s.
  - On submit:
    - Create `idea` object with client UUID + title derived from raw_input (first 50 chars).
    - If online + authed: upsert to Supabase.
    - If offline: store locally as “unsynced” and show banner.
  - Route: `Capture & Start` → `/idea/:id`.

  **Must NOT do**:
  - Do not call AI from Capture.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 14-16 | Blocked By: 6

  **References**:
  - Interaction: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`

  **Acceptance Criteria**:
  - [ ] Draft restored after reload
  - [ ] Just Capture creates item visible in Library

  **QA Scenarios**:
  ```
  Scenario: Offline Just Capture persists locally
    Tool: Playwright
    Steps: set offline; input; click Just Capture; reload; go Library
    Expected: idea appears with Unsynced badge
    Evidence: .sisyphus/evidence/task-11-offline.png
  ```

  **Commit**: YES | Message: `feat: implement capture flow with local drafts` | Files: `src/pages/CapturePage.tsx`, storage helpers

- [ ] 12. Library page (filters/search/sort + quick actions)

  **What to do**:
  - Query Supabase for allowed user’s ideas.
  - Merge in local unsynced ideas.
  - Implement search placeholder and default filters.
  - Card quick action `Continue 1 Step` routes to idea detail + focuses incubation input.
  - Archive/Delete (single + batch).

  **Must NOT do**:
  - Do not implement tag management UI in MVP.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 13-16 | Blocked By: 6,11

  **References**:
  - IA: `.sisyphus/drafts/every-idea-counts-ia-and-screens.md`

  **Acceptance Criteria**:
  - [ ] Can open idea detail from a card
  - [ ] Archived items hidden unless toggle enabled

  **QA Scenarios**:
  ```
  Scenario: Archive hides item
    Tool: Playwright
    Steps: archive an idea; ensure it disappears; enable Show archived
    Expected: hidden then reappears
    Evidence: .sisyphus/evidence/task-12-archive.webm
  ```

  **Commit**: YES | Message: `feat: add library list with filters and actions` | Files: `src/pages/LibraryPage.tsx`

- [ ] 13. Idea Detail page skeleton + data loading

  **What to do**:
  - Build `IdeaDetailPage` with header + incubation panel + note panel layout.
  - Load idea from Supabase (or local unsynced store) by `id`.
  - Keep `status` transitions per IA spec.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 14-15 | Blocked By: 6,11

  **Acceptance Criteria**:
  - [ ] Visiting `/idea/:id` renders without crashing for both synced and unsynced ideas

  **QA Scenarios**:
  ```
  Scenario: Open idea detail from Library
    Tool: Playwright
    Steps: create idea; click card
    Expected: header shows title/type/status
    Evidence: .sisyphus/evidence/task-13-detail.png
  ```

  **Commit**: YES | Message: `feat: add idea detail layout and loader` | Files: `src/pages/IdeaDetailPage.tsx`

- [ ] 14. Incubation panel (Answer/Ask AI toggle + single-stage session)

  **What to do**:
  - Implement incubation UI exactly per interaction spec section 6.2:
    - stage card goal line + single question
    - enable/disable rules
    - collapse previous stages
    - Answer/Ask AI toggle (MVP must-have)
  - Implement client-side state machine storage:
    - `current_state`, `turn_count_in_state`, `collected`
  - Integrate with Edge Functions:
    - Answer mode calls `ai_router`
    - Ask AI mode calls `ai_ask`
  - Enforce single-stage per session:
    - after one successful stage completion, show modal and stop prompting until user chooses

  **Must NOT do**:
  - Do not let Ask AI call advance stage.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: complex UI state + correctness.
  - Skills: [`playwright`] — Reason: UI behavior verification.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: 15-20 | Blocked By: 8,9,13

  **References**:
  - Interaction: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`
  - Prompt appendix: `.sisyphus/drafts/every-idea-counts-unified-spec.md`

  **Acceptance Criteria**:
  - [ ] Ask AI response does not change `current_state`
  - [ ] Continue only enabled when `ADVANCE` or forced (turn_count=2)

  **QA Scenarios**:
  ```
  Scenario: Ask AI does not advance stage
    Tool: Playwright
    Steps: open idea; switch Ask AI; ask; observe stage label
    Expected: stage label unchanged; Continue enablement unchanged
    Evidence: .sisyphus/evidence/task-14-askai.webm

  Scenario: Single-stage default session
    Tool: Playwright
    Steps: answer until stage completes; observe modal
    Expected: modal appears; no auto-advance without user action
    Evidence: .sisyphus/evidence/task-14-one-step.webm
  ```

  **Commit**: YES | Message: `feat: implement incubation panel with ask-ai and one-step sessions` | Files: `src/components/incubation/*`

- [ ] 15. Note panel (Markdown editor + sanitize preview + append generation)

  **What to do**:
  - Implement textarea editor + live preview using `react-markdown` + `rehype-sanitize`.
  - Save updates to Supabase (or local unsynced store).
  - Generate Note calls `ai_extract_note` and appends to end.
  - Export Markdown + HTML (HTML export uses sanitized render output).

  **Must NOT do**:
  - Do not render unsanitized HTML in preview or export.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 16-20 | Blocked By: 10,13

  **References**:
  - Interaction: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`

  **Acceptance Criteria**:
  - [ ] Generate Note twice appends twice without overwriting manual edits
  - [ ] Export HTML does not include `<script>` tags from content

  **QA Scenarios**:
  ```
  Scenario: Append-only generation
    Tool: Playwright
    Steps: type manual text; Generate Note; Generate Note again
    Expected: manual text still present; two appended blocks
    Evidence: .sisyphus/evidence/task-15-append.png
  ```

  **Commit**: YES | Message: `feat: add markdown note editor, preview, export, and append generation` | Files: `src/components/note/*`

- [ ] 16. Weekly Review page (stuck-longest + quick actions)

  **What to do**:
  - Implement `/review` view:
    - Query `draft/incubating` and order by `updated_at asc`.
    - Provide 3 quick actions: Continue 1 Step / Generate Note / Archive.
  - Ensure actions route to detail page and focus correct panel.

  **Recommended Agent Profile**:
  - Category: `visual-engineering`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 18-20 | Blocked By: 12,14,15

  **Acceptance Criteria**:
  - [ ] Ordering matches oldest updated_at first

  **QA Scenarios**:
  ```
  Scenario: Review ordering
    Tool: Playwright
    Steps: create 3 ideas; update one; open review
    Expected: oldest updated appears first
    Evidence: .sisyphus/evidence/task-16-review.png
  ```

  **Commit**: YES | Message: `feat: add weekly review page with quick actions` | Files: `src/pages/WeeklyReviewPage.tsx`

- [ ] 17. Settings page (provider selection + strict knobs)

  **What to do**:
  - Implement settings stored locally (localStorage):
    - provider: `glm|qwen`
    - style: `sharp|gentle`
    - verbosity: `short|detailed`
  - Client sends provider/style/verbosity to Edge Functions (validated server-side).

  **Must NOT do**:
  - Do not store AI keys.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 18-20 | Blocked By: 2

  **Acceptance Criteria**:
  - [ ] Settings persist after reload

  **QA Scenarios**:
  ```
  Scenario: Provider choice affects function requests
    Tool: Playwright
    Steps: set provider to qwen; trigger ai_router; inspect request payload (test hook)
    Expected: provider=qwen
    Evidence: .sisyphus/evidence/task-17-settings.txt
  ```

  **Commit**: YES | Message: `feat: add settings for provider and ai style` | Files: `src/pages/SettingsPage.tsx`, `src/services/settings.ts`

- [ ] 18. Unit tests for state-machine utilities + sanitization

  **What to do**:
  - Add pure utility modules:
    - `src/domain/incubation.ts` (stage ordering, one-step session rules)
    - `src/domain/text.ts` (normalize question marks, one-question enforcement)
  - Add Vitest tests for these modules.

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 19-20 | Blocked By: 14,15

  **Acceptance Criteria**:
  - [ ] `npm test` passes

  **QA Scenarios**:
  ```
  Scenario: Unit test run
    Tool: Bash
    Steps: npm test
    Expected: PASS
    Evidence: .sisyphus/evidence/task-18-vitest.txt
  ```

  **Commit**: YES | Message: `test: add incubation domain unit tests` | Files: `src/domain/*`, `src/domain/*.test.ts`

- [ ] 19. Playwright E2E: core loop + Ask AI invariants

  **What to do**:
  - Configure Playwright.
  - Write tests:
    - capture → create idea → open detail
    - Ask AI does not change stage
    - one-step session modal appears
    - note generation appends
    - weekly review ordering

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: none | Blocked By: 11-17,21

  **Acceptance Criteria**:
  - [ ] `npm run test:e2e` passes locally against Supabase local

  **QA Scenarios**:
  ```
  Scenario: E2E suite
    Tool: Bash
    Steps: supabase start; npm run dev; npm run test:e2e
    Expected: PASS
    Evidence: .sisyphus/evidence/task-19-e2e.txt
  ```

  **Commit**: YES | Message: `test: add playwright e2e for mvp flows` | Files: `playwright.config.ts`, `e2e/*`

- [ ] 20. Security + smoke checks (RLS + functions)

  **What to do**:
  - Add scripts under `scripts/`:
    - `scripts/rls-smoke.ts` (two users, cross-access blocked)
    - `scripts/functions-smoke.sh` (401/403/200 checks)
  - Document how to obtain a local JWT for allowed user in README.

  **Must NOT do**:
  - Do not use service role key in client runtime.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: none | Blocked By: 5,7-10

  **Acceptance Criteria**:
  - [ ] Scripts run and produce PASS/FAIL exit codes

  **QA Scenarios**:
  ```
  Scenario: Function auth enforcement
    Tool: Bash
    Steps: ./scripts/functions-smoke.sh
    Expected: 401 unauth; 403 not allowed; 200 allowed
    Evidence: .sisyphus/evidence/task-20-smoke.txt
  ```

  **Commit**: YES | Message: `chore: add security smoke scripts` | Files: `scripts/*`, `README.md`

- [ ] 21. Offline local-first persistence + background sync (MVP contract)

  **What to do**:
  - Implement IndexedDB-backed local store (recommended lib: `idb-keyval`) for:
    - local ideas (including offline-created)
    - pending mutation queue (create/update/archive/delete)
  - Define mutation envelope:
    - `{ idempotency_key, idea_id, op_type, payload, created_at }`
  - Implement sync worker:
    - triggers on app boot and `window.online` event
    - processes queue FIFO
    - uses Supabase upsert/update under RLS (owner_id default)
  - Sync rules (MVP):
    - If server rejects due to auth/offline: keep queued
    - If server accepts: mark synced and remove queue item
    - No conflict UI; LWW is “whatever write arrives last”
  - UI:
    - Unsynced items show badge `未同步`
    - If sync fails, show toast `同步失败，稍后重试`

  **Must NOT do**:
  - Do not attempt multi-device conflict resolution UI in MVP.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: correctness + edge cases.
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 11-16 | Blocked By: 6

  **References**:
  - Offline behavior: `.sisyphus/drafts/every-idea-counts-interaction-spec.md`

  **Acceptance Criteria**:
  - [ ] Create idea offline → appears in Library with `未同步`
  - [ ] Toggle online → queue syncs and badge disappears

  **QA Scenarios**:
  ```
  Scenario: Offline create then auto-sync
    Tool: Playwright
    Steps: go offline; Just Capture; confirm Unsynced badge; go online; wait
    Expected: badge disappears; item exists in Supabase
    Evidence: .sisyphus/evidence/task-21-sync.webm
  ```

  **Commit**: YES | Message: `feat: add offline local store and sync queue` | Files: `src/services/offline/*`

- [ ] 22. Edge Function hardening (timeouts, size caps, output validation)

  **What to do**:
  - Add strict request validation to all three functions:
    - Max raw_input length
    - Max user_latest_reply length
    - Reject empty inputs with 400 and stable JSON error shape
  - Add upstream timeouts using `AbortController`.
  - Normalize punctuation:
    - Convert `？` to `?`
  - Enforce AI output constraints server-side:
    - `ai_router`: JSON parse; action enum; question has exactly one `?`
    - `ai_ask`: answer has 0 `?` and <=3 sentences
  - Ensure all error responses include CORS headers.

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 14-15,20 | Blocked By: 8-10

  **References**:
  - Supabase CORS gotcha: https://supabase.com/docs/guides/functions/cors
  - Z.ai errors: https://docs.z.ai/api-reference/api-code
  - DashScope errors: https://www.alibabacloud.com/help/en/model-studio/error-code

  **Acceptance Criteria**:
  - [ ] Invalid inputs produce 400 with JSON body
  - [ ] Upstream timeout produces 504 with JSON body

  **QA Scenarios**:
  ```
  Scenario: Router rejects multi-question output
    Tool: Bash
    Steps: force model output (test double) containing two '?' characters
    Expected: server returns sanitized single-question or 502 with validation error
    Evidence: .sisyphus/evidence/task-22-validate.txt
  ```

  **Commit**: YES | Message: `fix: harden edge functions validation and timeouts` | Files: `supabase/functions/*`

- [ ] 23. Supabase remote deploy runbook (functions + secrets)

  **What to do**:
  - Document exact deploy steps in `README.md`:
    - `supabase login`
    - `supabase link --project-ref <ref>`
    - `supabase db push`
    - `supabase functions deploy ai_router`
    - `supabase functions deploy ai_ask`
    - `supabase functions deploy ai_extract_note`
    - `supabase secrets set --env-file ./supabase/.env.production` (file not committed)
  - Define required secrets:
    - `ALLOWED_EMAIL`
    - `ZAI_API_KEY`, `ZAI_BASE_URL`
    - `DASHSCOPE_API_KEY`, `DASHSCOPE_BASE_URL`

  **Recommended Agent Profile**:
  - Category: `quick`
  - Skills: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: none | Blocked By: 7-10

  **References**:
  - Secrets: https://supabase.com/docs/guides/functions/secrets
  - Deploy: https://supabase.com/docs/guides/functions/quickstart

  **Acceptance Criteria**:
  - [ ] README contains exact commands; secrets list complete

  **QA Scenarios**:
  ```
  Scenario: Remote deploy dry-run checklist
    Tool: Bash
    Steps: follow README steps with placeholders (no secrets)
    Expected: commands are syntactically correct and in correct order
    Evidence: .sisyphus/evidence/task-23-deploy.txt
  ```

  **Commit**: YES | Message: `docs: add supabase deploy and secrets runbook` | Files: `README.md`

- [ ] 24. Plan compliance: remove contradictions + final self-check

  **What to do**:
  - Ensure all locked decisions are implemented:
    - Ask AI is MVP
    - One-step default sessions
    - Append-only note generation
    - Weekly review ordering
  - Run:
    - `npm run build`
    - `npm test`
    - `npm run test:e2e`
    - `./scripts/rls-smoke.ts`
    - `./scripts/functions-smoke.sh`
  - Collect evidence artifacts.

  **Recommended Agent Profile**:
  - Category: `deep` — Reason: cross-check against spec.
  - Skills: [`playwright`]

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: Final Verification | Blocked By: 1-23

  **Acceptance Criteria**:
  - [ ] All commands pass

  **QA Scenarios**:
  ```
  Scenario: Full verification run
    Tool: Bash
    Steps: run the listed commands
    Expected: all PASS
    Evidence: .sisyphus/evidence/task-24-verification.txt
  ```

  **Commit**: NO | Message: n/a | Files: n/a

## Final Verification Wave (4 parallel agents, ALL must APPROVE)
- [ ] F1. Plan Compliance Audit — oracle
- [ ] F2. Code Quality Review — unspecified-high
- [ ] F3. Automated E2E QA — unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity Check — deep

## Commit Strategy
- Use frequent, atomic commits; no commit should mix infra + feature + refactor.

## Success Criteria
- You can capture a 1-line idea, run one incubation stage, generate an actionable note, and see it surface in weekly review.
- Ask AI helps you unblock without changing the stage.
