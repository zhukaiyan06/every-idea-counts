import { describe, expect, it } from 'vitest'

import {
  countQuestionMarks,
  hasExactlyOneQuestion,
  limitSentences,
  normalizeQuestionMarks,
  removeQuestionMarks,
} from './text'

describe('text domain', () => {
  it('normalizes chinese question marks', () => {
    expect(normalizeQuestionMarks('你好？')).toBe('你好?')
  })

  it('counts question marks', () => {
    expect(countQuestionMarks('a?b?')).toBe(2)
    expect(countQuestionMarks('a？b')).toBe(1)
  })

  it('checks exactly one question', () => {
    expect(hasExactlyOneQuestion('问题?')).toBe(true)
    expect(hasExactlyOneQuestion('问题??')).toBe(false)
    expect(hasExactlyOneQuestion('没有问题')).toBe(false)
  })

  it('removes all question marks', () => {
    expect(removeQuestionMarks('你好吗?很好？')).toBe('你好吗很好')
  })

  it('limits to max sentences', () => {
    expect(limitSentences('第一句。第二句。第三句。第四句。', 3)).toBe('第一句。第二句。第三句。')
  })
})
