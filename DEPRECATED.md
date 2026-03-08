# Deprecated Components (v1.0)

This document lists components deprecated in v2.0 for backward compatibility.

---

## 🧹 Removed in Phase 4

### 1. IncubationPanel Component

**File**: `src/components/incubation/IncubationPanel.tsx` (deleted)

**Reason**: v2.0 replaced the 5-stage incubation with a two-mode capture system (Quick/Deep).

**Replacement**: 
- Use `CapturePage` with `mode="deep"` for deep incubation
- See `src/pages/CapturePage.tsx` for current implementation

**Timeline**: Deprecated since 2026-03-06, removed on 2026-03-07

---

### 2. Incubation Domain Utilities

**File**: `src/domain/incubation.ts` (deleted)

**Reason**: The 5-stage state machine logic is no longer needed in v2.0.

**What changed**:
- ❌ Stage progression logic (`getNextStage`)
- ❌ Turn counting (`shouldEnableContinue`)
- ❌ Stage skipping (`createSkippedValue`)
- ✅ Legacy compatibility path removed in Phase 4

**Replacement**: Static questions defined in `CapturePage.tsx` (`DEEP_QUESTIONS`)

**Timeline**: Deprecated since 2026-03-06, removed on 2026-03-07

---

### 3. ai_router Edge Function

**File**: `supabase/functions/ai_router/index.ts` (deleted)

**Reason**: v2.0 uses static frontend questions for deep mode, eliminating the need for AI-driven routing.

**Replacement**:
- `ai_extract_note`: Generates Markdown note (supports quick/deep modes)
- `ai_ask`: Continue Digging mode (free-form Q&A)

**Timeline**: Deprecated since 2026-03-06, removed on 2026-03-07

---

## 📚 Migration Guide

### v1.0 → v2.0

#### Incubation Flow Changes

**v1.0 (5-stage incubation)**:
```
Input → Stage 1 (Problem) → Stage 2 (Audience) → 
Stage 3 (Value) → Stage 4 (Steps) → Stage 5 (Risk) → Note
```

**v2.0 (Two-mode capture)**:
```
Quick Mode: Input → 1 API call → Note
Deep Mode: Input → 3 Questions → 1 API call → Note
```

#### API Call Reduction

| Scenario | v1.0 | v2.0 |
|----------|------|------|
| Quick Capture | 10+ calls | 1 call |
| Deep Incubation | 10+ calls | 1 call |
| Continue Digging | N/A | 1+ calls |

#### Data Model Changes

**New fields in v2.0**:
```typescript
interface IdeaRecord {
  // ... existing fields ...
  capture_mode?: 'quick' | 'deep'  // NEW
  deep_answers?: {                  // NEW
    q1: string
    q2: string
    q3: string
  }
}
```

**Removed legacy fields (Phase 4)**:
- `current_state`
- `turn_count_in_state`
- `collected`

---

## 🔧 Cleanup Plan

### Phase 1 (v2.0)
- ✅ Mark files as deprecated
- ✅ Keep runtime compatibility for old data schema
- ✅ Update documentation

### Phase 2 (Phase 4 cleanup completed)
- ✅ Remove legacy frontend incubation path (`IncubationPanel`)
- ✅ Remove legacy incubation domain and unit tests
- ✅ Switch smoke script from `ai_router` to `ai_extract_note`
- ✅ Remove `ai_router` function entrypoint
- ✅ Add DB migration to drop `current_state` / `turn_count_in_state` / `collected`

### Phase 3 (v3.0 - Future)
- [ ] Remove legacy references from historical docs
- [ ] Validate old snapshots/exports migration behavior

---

## 📖 References

- Design Document: `docs/design/two-mode-capture.md`
- MVP Plan: `docs/plans/2026-03-05-every-idea-counts-pwa-mvp.md`
- AGENTS.md: Section "Deprecated Components (v1.0)"
