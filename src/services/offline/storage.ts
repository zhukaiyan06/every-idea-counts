import type { IdeaRecord } from './types'

const UNSYNCED_KEY = 'unsynced-ideas'

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

export function loadUnsyncedIdeas(): IdeaRecord[] {
  return safeParseArray<IdeaRecord>(localStorage.getItem(UNSYNCED_KEY))
}

export function saveUnsyncedIdeas(ideas: IdeaRecord[]) {
  localStorage.setItem(UNSYNCED_KEY, JSON.stringify(ideas))
}

export function findUnsyncedIdea(id: string): IdeaRecord | null {
  const ideas = loadUnsyncedIdeas()
  return ideas.find((item) => item.id === id) ?? null
}

export function isUnsyncedIdea(id: string): boolean {
  return Boolean(findUnsyncedIdea(id))
}

export function upsertUnsyncedIdea(idea: IdeaRecord) {
  const ideas = loadUnsyncedIdeas()
  const index = ideas.findIndex((item) => item.id === idea.id)
  if (index >= 0) {
    ideas[index] = idea
  } else {
    ideas.push(idea)
  }
  saveUnsyncedIdeas(ideas)
}

export function updateUnsyncedIdea(id: string, patch: Partial<IdeaRecord>): IdeaRecord | null {
  const ideas = loadUnsyncedIdeas()
  const index = ideas.findIndex((item) => item.id === id)
  if (index < 0) return null
  const updated = {
    ...ideas[index],
    ...patch,
    updated_at: patch.updated_at ?? new Date().toISOString(),
  }
  ideas[index] = updated
  saveUnsyncedIdeas(ideas)
  return updated
}

export function removeUnsyncedIdea(id: string) {
  const ideas = loadUnsyncedIdeas()
  saveUnsyncedIdeas(ideas.filter((item) => item.id !== id))
}
