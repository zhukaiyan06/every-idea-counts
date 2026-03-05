import { describe, expect, it } from 'vitest'

import { createSkippedValue, getNextStage, normalizeStage, shouldEnableContinue } from './incubation'

describe('incubation domain', () => {
  it('normalizes unknown stage to problem_definition', () => {
    expect(normalizeStage('unknown')).toBe('problem_definition')
    expect(normalizeStage(null)).toBe('problem_definition')
  })

  it('returns next stage correctly', () => {
    expect(getNextStage('problem_definition')).toBe('target_audience')
    expect(getNextStage('risk_assessment')).toBeNull()
  })

  it('enables continue only on ADVANCE or forced turn count', () => {
    expect(shouldEnableContinue('ADVANCE', 0)).toBe(true)
    expect(shouldEnableContinue('FOLLOW_UP', 1)).toBe(false)
    expect(shouldEnableContinue('FOLLOW_UP', 2)).toBe(true)
  })

  it('creates skip placeholder text', () => {
    expect(createSkippedValue()).toContain('用户选择跳过')
  })
})
