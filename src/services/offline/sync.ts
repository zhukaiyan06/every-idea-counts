import { supabase } from '../../lib/supabase'
import { hasPendingMutationsForIdea, loadMutationQueue, saveMutationQueue } from './queue'
import { removeUnsyncedIdea } from './storage'
import type { MutationEnvelope } from './types'

export const SYNC_FAILURE_EVENT = 'offline-sync-failed'
export const SYNC_UPDATED_EVENT = 'offline-sync-updated'

let isRunning = false
let runnerStarted = false

export function startOfflineSyncRunner() {
  if (runnerStarted) return
  runnerStarted = true

  const trigger = () => {
    void runOfflineSync()
  }

  window.addEventListener('online', trigger)
  trigger()
}

export async function runOfflineSync() {
  if (isRunning) return
  isRunning = true
  try {
    await processQueue()
  } finally {
    isRunning = false
  }
}

async function processQueue() {
  let queue = loadMutationQueue()
  if (queue.length === 0) return

  let updated = false

  while (queue.length > 0) {
    const item = queue[0]
    const success = await handleMutation(item)
    if (!success) {
      window.dispatchEvent(new CustomEvent(SYNC_FAILURE_EVENT))
      break
    }

    queue = queue.slice(1)
    saveMutationQueue(queue)
    updated = true

    if (!hasPendingMutationsForIdea(item.idea_id, queue)) {
      removeUnsyncedIdea(item.idea_id)
    }
  }

  if (updated) {
    window.dispatchEvent(new CustomEvent(SYNC_UPDATED_EVENT))
  }
}

async function handleMutation(item: MutationEnvelope): Promise<boolean> {
  if (item.op_type === 'create') {
    const { error } = await supabase.from('ideas').insert(item.payload)
    if (!error) return true
    const code = (error as { code?: string }).code
    return code === '23505'
  }

  if (item.op_type === 'update') {
    const { error } = await supabase.from('ideas').update(item.payload).eq('id', item.idea_id)
    return !error
  }

  if (item.op_type === 'delete') {
    const { error } = await supabase.from('ideas').delete().eq('id', item.idea_id)
    return !error
  }

  const payload = {
    ...item.payload,
    status: 'archived',
  }
  const { error } = await supabase.from('ideas').update(payload).eq('id', item.idea_id)
  return !error
}
