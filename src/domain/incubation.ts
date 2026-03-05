export type StageKey =
  | 'problem_definition'
  | 'target_audience'
  | 'unique_value'
  | 'execution_steps'
  | 'risk_assessment'

export const STAGE_ORDER: StageKey[] = [
  'problem_definition',
  'target_audience',
  'unique_value',
  'execution_steps',
  'risk_assessment',
]

export function normalizeStage(raw?: string | null): StageKey {
  if (!raw) return 'problem_definition'
  return STAGE_ORDER.includes(raw as StageKey) ? (raw as StageKey) : 'problem_definition'
}

export function getNextStage(stage: StageKey): StageKey | null {
  const index = STAGE_ORDER.indexOf(stage)
  if (index < 0 || index >= STAGE_ORDER.length - 1) return null
  return STAGE_ORDER[index + 1]
}

export function shouldEnableContinue(action: 'FOLLOW_UP' | 'ADVANCE', turnCountInState: number): boolean {
  if (action === 'ADVANCE') return true
  return turnCountInState >= 2
}

export function createSkippedValue(): string {
  return '（待补充：用户选择跳过本阶段）'
}
