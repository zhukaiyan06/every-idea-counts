export function normalizeQuestionMarks(input: string): string {
  return input.replace(/？/g, '?')
}

export function countQuestionMarks(input: string): number {
  return normalizeQuestionMarks(input).split('').filter((char) => char === '?').length
}

export function hasExactlyOneQuestion(input: string): boolean {
  return countQuestionMarks(input) === 1
}

export function removeQuestionMarks(input: string): string {
  return input.replace(/[?？]/g, '')
}

export function limitSentences(input: string, maxSentences = 3): string {
  const parts = input
    .split(/[。！？.!?]/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (parts.length === 0) return ''
  return `${parts.slice(0, maxSentences).join('。')}。`
}
