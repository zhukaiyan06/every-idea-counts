# Every Idea Counts (PWA) — MVP Implementation Plan v2.0

> **Last Updated**: 2026-03-07
> **Status**: Phase 1-6 Complete ✅

## TL;DR

## Changelog (v2.0)

### Breaking Changes
- **Removed**: 5-stage incubation state machine (`ai_router` Edge Function)
- **Removed**: Multi-turn AI conversation for incubation
- **Added**: Two capture modes: Quick (default) and Deep
- **Added**: Type-specific 3 questions (frontend static, no AI calls)
- **Simplified**: Single API call for note generation in both modes

### API Call Reduction
| Scenario | v1 | v2 |
|----------|----|----|
| Quick Capture | 10+ calls | 1 call |
| Deep Incubation | 10+ calls | 1 call |
| Continue Digging | N/A | 1+ calls |

## Context

### Original Request
- Idea-capture app concept: "every idea counts", solve "ideas get forgotten because they are not concretized".
- Core loop: capture idea → AI generates note → saved in library.
- **New principle**: Simple and Fast — minimal friction, instant results.

### Locked Decisions (v2.0)
- MVP platform: Web-first PWA
- Audience: single user (you)
- AI cost: use your own single API key (server-side only)
- Capture entry: PWA only (in-app shortcut + homepage entry)
- Idea types: user selects at capture: `product|creative|research`
- **Capture modes**: Quick (default, 1 API call) or Deep (3 questions + 1 API call)
- **Deep mode questions**: Frontend static, no AI calls
- Editor: Markdown + live preview
- Note re-generation: append to end (never overwrite)
- Review: weekly review view; default sort "stuck longest" (oldest `updated_at`)
- Continue Digging: Free-form AI chat after note generation
- Sync: Last-Write-Wins by `updated_at`
- **Auth**: Anonymous auto-login (no manual login required)

## Work Objectives

### Core Objective
Deliver a PWA MVP that makes "capture → instant note → weekly review" feel fast and repeatable. Deep incubation is optional, not forced.

### Deliverables
- PWA app with routes: `/capture`, `/library`, `/review`, `/idea/:id`, `/settings`
- Supabase: `ideas` + `idea_messages` tables + RLS + single-user auth constraints
- Edge Functions:
  - `ai_extract_note`: generates the Markdown template note (supports quick/deep modes)
  - `ai_ask`: Continue Digging mode (free-form Q&A after note generation)
  - ~~`ai_router`~~: REMOVED
- Capture UI:
  - Tab switch: Quick Capture / Deep Incubation
  - Type selector: product / creative / research
  - Deep mode: 3 type-specific questions (frontend static)
- Notes:
  - Markdown editor + live preview
  - Export `.md` and `.html`
  - Continue Digging button → AI chat → Update Note
- Weekly Review:
  - Stuck-longest ordering
  - Quick actions: Continue Digging / Archive

### Definition of Done
- `npm ci && npm run build` succeeds
- `npm run dev` runs and critical flows pass via Playwright E2E
- Supabase local: `supabase start` + migrations apply without errors
- RLS verified: cannot access ideas from another user
- AI proxy verified: API key never appears in client bundles

## TODOs (v2.0)

> Implementation + Test = ONE task.

### Phase 1: Quick Capture Mode (Priority: High) ✅

- [x] ~~1. Create repo workspace + baseline toolchain~~ (Done)
- [x] ~~2. Implement app routing + page shells~~ (Done)
- [x] ~~3. Add PWA manifest + service worker~~ (Done)
- [x] ~~4. Initialize Supabase (local dev) + migrations folder~~ (Done)
- [x] ~~5. Database schema: ideas + idea_messages + triggers + indexes + RLS~~ (Done)
- [x] ~~6. Frontend Supabase client + single-user gate~~ (Done)
- [x] ~~7. Edge Functions: shared utilities (CORS + auth + allowlist)~~ (Done)

- [x] 8. **NEW: Modify CapturePage for two-mode UI** ✅
  - Add tab switch: Quick Capture (default) / Deep Incubation
  - Type selector: product / creative / research
  - Quick mode: single textarea + "记录想法" button
  - Deep mode: textarea + 3 type-specific questions
  - Local draft persistence (keep existing)
  - **Completed**: 2026-03-06
- [x] 9. **MODIFY: Edge Function `ai_extract_note` for two modes** ✅
  - New parameter: `capture_mode: 'quick' | 'deep'`
  - New parameter: `deep_answers?: { q1, q2, q3 }`
  - Quick mode prompt: infer and expand from single input
  - Deep mode prompt: integrate raw_input + 3 answers
  - **Completed**: 2026-03-06
- [x] 10. **MODIFY: IdeaDetailPage simplify** ✅
  - Remove incubation panel (5-stage)
  - Show note immediately after capture
  - Add "继续深入挖掘" button
  - Add status badges (type + status + capture_mode)
  - **Completed**: 2026-03-06

### Phase 2: Deep Incubation Mode ✅

- [x] 11. **NEW: Create DeepModeQuestions component** ✅
  - Product questions:
    - Q1: 这个想法为哪些用户解决什么问题？
    - Q2: 用户在什么场景下会使用？
    - Q3: 他们现在怎么解决这个问题？
  - Creative questions:
    - Q1: 主题或核心信息是什么？
    - Q2: 目标受众是谁？为什么感兴趣？
    - Q3: 有什么参考作品或灵感来源？
  - Research questions:
    - Q1: 想探索或验证什么问题？
    - Q2: 打算用什么方法研究？
    - Q3: 已有相关研究有哪些？
  - All questions: frontend static, no AI calls
  - Validation: all 3 questions must be answered before generating note
  - **Completed**: 2026-03-06 (integrated in CapturePage.tsx)

### Phase 3: Continue Digging ✅

- [x] 12. **NEW: Create ContinueDiggingDialog component** ✅
  - Reuse `ai_ask` Edge Function
  - Free-form AI chat interface
  - "更新笔记" button: append new insights to existing note
  - Close button: return to idea detail
  - **Completed**: 2026-03-06

- [x] 13. **MODIFY: NotePanel for Continue Digging** ✅
  - Add "继续深入挖掘" button
  - Show conversation history
  - "更新笔记" triggers note update with conversation
  - **Completed**: 2026-03-06

### Phase 4: Cleanup & Migration ✅

- [x] 14. **DEPRECATE: Mark files as obsolete** ✅
  - `src/components/incubation/IncubationPanel.tsx` → deleted
  - `src/domain/incubation.ts` → deleted
  - `supabase/functions/ai_router/` → deleted
  - **Completed**: 2026-03-07

- [x] 15. **NEW: Database migration** ✅
  - Add `capture_mode` column (default: 'quick')
  - Add `deep_answers` JSONB column
  - Drop legacy columns: `current_state`, `turn_count_in_state`, `collected`
  - **Completed**: 2026-03-07

- [x] 16. **UPDATE: All documentation** ✅
  - unified-spec.md
  - interaction-spec.md
  - AGENTS.md
  - README.md
  - **Completed**: 2026-03-07

### Phase 5: Testing & Verification ✅

- [x] 17. **NEW: Update E2E tests for two-mode flow** ✅
  - Quick capture → note generated
  - Deep capture → 3 questions → note generated
  - Continue digging → chat → note updated
  - Weekly review ordering
  - **Completed**: 2026-03-07 (14/14 tests passing)

- [x] 18. **Security + smoke checks** ✅
  - **Completed**: 2026-03-07

### Phase 6: One-Click Capture Enhancement ✅

- [x] 19. **FIX: Increase AI generation timeout** ✅
  - Changed from 2s to 60s in `generateNote.ts`
  - Allows proper AI response time (10-30s typical)
  - **Completed**: 2026-03-07

- [x] 20. **NEW: Anonymous auto-login** ✅
  - Modified `useSession.ts` to auto sign-in anonymously
  - Users can start using the app immediately
  - No manual login required
  - Updated `supabase/config.toml`: `enable_anonymous_sign_ins = true`
  - **Completed**: 2026-03-07

- [x] 21. **ENHANCE: One-click capture with loading state** ✅
  - Button shows "保存中..." → "AI 生成中..." → complete
  - Wait for AI generation before navigating to detail page
  - User only clicks once, sees progress, gets result
  - **Completed**: 2026-03-07

## Success Criteria (v2.0)
- ✅ Quick Capture: User inputs one line → note appears in < 30 seconds
- ✅ Deep Incubation: User answers 3 questions → note appears in < 30 seconds
- ✅ Continue Digging: User can ask follow-up questions and update note
- ✅ Weekly Review: Shows stuck-longest ideas first
- ✅ All tests pass (14/14 E2E tests)
- ✅ One-click capture: Single button click → AI generates → auto-navigate

## Application Features (v2.0)

### 核心特色
1. **一键记录并生成** - 用户只需点击一次，系统自动完成「保存 → AI 生成 → 跳转」全流程
2. **双模式捕获** - 快速记录（1 API 调用）或深入孵化（3 问题 + 1 API 调用）
3. **匿名自动登录** - 打开应用即可使用，无需手动登录
4. **继续深入挖掘** - 笔记生成后可与 AI 对话，持续深化想法
5. **离线优先** - 本地存储 + 后台同步，断网也能记录

### 用户流程
```
快速记录模式:
  输入想法 → 点击按钮 → 「保存中...」→「AI 生成中...」→ 自动跳转到笔记详情页

深入孵化模式:
  输入想法 → 回答 3 个问题 → 点击按钮 → AI 生成 → 自动跳转到笔记详情页

继续深入挖掘:
  查看笔记 → 点击「继续深入挖掘」→ 与 AI 对话 → 更新笔记
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Quick mode note quality low | Optimize prompt for inference and expansion |
| Users miss deep mode | UI design highlights tab switch |
| Old data incompatible | Migration script, keep old columns |
| AI generation timeout | Increased timeout to 60s |

## References
- Two-mode design document: `docs/design/two-mode-capture.md`
- Original MVP plan: `docs/plans/2026-03-05-every-idea-counts-pwa-mvp.md` (v1.0)