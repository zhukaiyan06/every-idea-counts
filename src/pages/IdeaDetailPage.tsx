import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import IncubationPanel from '../components/incubation/IncubationPanel'
import NotePanel from '../components/note/NotePanel'
import { supabase } from '../lib/supabase'

type IdeaType = 'product' | 'creative' | 'research'
type IdeaStatus = 'draft' | 'incubating' | 'completed' | 'archived'

interface IdeaItem {
  id: string
  idea_type: IdeaType
  title: string
  raw_input: string
  status: IdeaStatus
  final_note?: string | null
  current_state?: string | null
  turn_count_in_state?: number | null
  collected?: Record<string, string> | null
  created_at: string
  updated_at: string
  unsynced?: boolean
}

interface StoredIdea {
  id: string
  idea_type: IdeaType
  title?: string
  raw_input?: string
  status?: IdeaStatus
  final_note?: string | null
  current_state?: string | null
  turn_count_in_state?: number | null
  collected?: Record<string, string> | null
  created_at?: string
  updated_at?: string
}

const IDEA_TYPE_LABEL: Record<IdeaType, string> = {
  product: '产品',
  creative: '创作',
  research: '研究',
}

const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  draft: '草稿',
  incubating: '孵化中',
  completed: '已完成',
  archived: '已归档',
}

function normalizeIdea(raw: StoredIdea, unsynced = false): IdeaItem {
  return {
    id: raw.id,
    idea_type: raw.idea_type,
    title: raw.title || '（未命名）',
    raw_input: raw.raw_input || '',
    status: raw.status || 'draft',
    final_note: raw.final_note,
    current_state: raw.current_state,
    turn_count_in_state: raw.turn_count_in_state,
    collected: raw.collected,
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: raw.updated_at || new Date().toISOString(),
    unsynced,
  }
}

export default function IdeaDetailPage() {
  const { id } = useParams()
  const [idea, setIdea] = useState<IdeaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadIdea = async () => {
      if (!id) {
        setError('缺少想法 ID')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: dbError } = await supabase
        .from('ideas')
        .select('id, idea_type, title, raw_input, status, final_note, current_state, turn_count_in_state, collected, created_at, updated_at')
        .eq('id', id)
        .maybeSingle()

      if (!dbError && data) {
        setIdea(normalizeIdea(data))
        setLoading(false)
        return
      }

      const localUnsynced = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as StoredIdea[]
      const localIdea = localUnsynced.find((item) => item.id === id)

      if (localIdea) {
        setIdea(normalizeIdea(localIdea, true))
        setLoading(false)
        return
      }

      setError('未找到该想法')
      setLoading(false)
    }

    loadIdea()
  }, [id])

  const statusStyle = useMemo(() => {
    if (!idea) return { color: '#374151', bg: '#F3F4F6' }
    if (idea.status === 'draft') return { color: '#1F2937', bg: '#F3F4F6' }
    if (idea.status === 'incubating') return { color: '#1D4ED8', bg: '#DBEAFE' }
    if (idea.status === 'completed') return { color: '#065F46', bg: '#D1FAE5' }
    return { color: '#92400E', bg: '#FEF3C7' }
  }, [idea])

  const updateStatus = async (nextStatus: IdeaStatus) => {
    if (!idea) return

    if (idea.unsynced) {
      const localUnsynced = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as StoredIdea[]
      const next = localUnsynced.map((item) =>
        item.id === idea.id ? { ...item, status: nextStatus, updated_at: new Date().toISOString() } : item,
      )
      localStorage.setItem('unsynced-ideas', JSON.stringify(next))
      setIdea((prev) => (prev ? { ...prev, status: nextStatus, updated_at: new Date().toISOString() } : prev))
      return
    }

    await supabase
      .from('ideas')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', idea.id)

    setIdea((prev) => (prev ? { ...prev, status: nextStatus, updated_at: new Date().toISOString() } : prev))
  }

  const patchIdea = async (patch: Partial<IdeaItem>) => {
    if (!idea) return

    if (idea.unsynced) {
      const localUnsynced = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as StoredIdea[]
      const next = localUnsynced.map((item) =>
        item.id === idea.id ? { ...item, ...patch, updated_at: patch.updated_at || new Date().toISOString() } : item,
      )
      localStorage.setItem('unsynced-ideas', JSON.stringify(next))
      setIdea((prev) => (prev ? { ...prev, ...patch } : prev))
      return
    }

    await supabase
      .from('ideas')
      .update(patch)
      .eq('id', idea.id)

    setIdea((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  if (loading) {
    return <section style={{ padding: 20 }}>加载中...</section>
  }

  if (error || !idea) {
    return (
      <section style={{ padding: 20 }}>
        <h1>想法详情</h1>
        <p style={{ color: '#B91C1C' }}>{error || '加载失败'}</p>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ marginBottom: 8 }}>想法详情</h1>
        <h2 style={{ margin: '4px 0 10px', fontSize: 20 }}>{idea.title}</h2>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: '#EEF2FF', color: '#3730A3' }}>
            {IDEA_TYPE_LABEL[idea.idea_type]}
          </span>
          <span style={{ padding: '4px 10px', borderRadius: 999, background: statusStyle.bg, color: statusStyle.color }}>
            {IDEA_STATUS_LABEL[idea.status]}
          </span>
          {idea.unsynced ? <span style={{ color: '#B45309' }}>未同步</span> : null}
        </div>

        <p style={{ color: '#6B7280', marginTop: 8 }}>更新于 {new Date(idea.updated_at).toLocaleString('zh-CN')}</p>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button type="button" onClick={() => updateStatus('incubating')}>标记为孵化中</button>
          <button type="button" onClick={() => updateStatus('completed')}>标记为完成</button>
          <button type="button" onClick={() => updateStatus('archived')}>归档</button>
        </div>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}
      >
        <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>孵化面板</h3>
          <IncubationPanel
            idea={{
              id: idea.id,
              idea_type: idea.idea_type,
              raw_input: idea.raw_input,
              current_state: idea.current_state,
              turn_count_in_state: idea.turn_count_in_state,
              collected: idea.collected,
              unsynced: idea.unsynced,
            }}
            onPatchIdea={async (patch) => {
              await patchIdea(patch)
            }}
            onGenerateNote={() => {}}
          />
        </section>

        <section style={{ border: '1px solid #ddd', borderRadius: 8, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>笔记面板</h3>
          <NotePanel
            idea={{
              id: idea.id,
              idea_type: idea.idea_type,
              raw_input: idea.raw_input,
              collected: idea.collected,
              final_note: idea.final_note,
            }}
            onPatchIdea={async (patch) => {
              await patchIdea(patch)
            }}
          />
        </section>
      </div>
    </section>
  )
}
