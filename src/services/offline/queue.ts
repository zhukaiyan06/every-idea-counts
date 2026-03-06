import type { MutationEnvelope } from './types'

const QUEUE_KEY = 'offline-mutation-queue'

function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as T[]
    return []
  } catch {
    return []
  }
}

export function loadMutationQueue(): MutationEnvelope[] {
  return safeParseArray<MutationEnvelope>(localStorage.getItem(QUEUE_KEY))
}

export function saveMutationQueue(queue: MutationEnvelope[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function enqueueMutation(item: MutationEnvelope) {
  const queue = loadMutationQueue()
  queue.push(item)
  saveMutationQueue(queue)
}

export function removeMutationsForIdea(ideaId: string) {
  const queue = loadMutationQueue()
  const next = queue.filter((item) => item.idea_id !== ideaId)
  saveMutationQueue(next)
}

export function hasPendingMutationsForIdea(ideaId: string, queue?: MutationEnvelope[]): boolean {
  const list = queue ?? loadMutationQueue()
  return list.some((item) => item.idea_id === ideaId)
}
