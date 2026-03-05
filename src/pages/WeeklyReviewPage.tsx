import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type IdeaType = 'product' | 'creative' | 'research'
type IdeaStatus = 'draft' | 'incubating' | 'completed' | 'archived'

interface IdeaItem {
  id: string
  idea_type: IdeaType
  title: string
  raw_input: string
  status: IdeaStatus
  created_at: string
  updated_at: string
  unsynced?: boolean
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

export default function WeeklyReviewPage() {
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadReviewIdeas = async () => {
      setLoading(true)

      const { data, error } = await supabase
        .from('ideas')
        .select('id, idea_type, title, raw_input, status, created_at, updated_at')
        .in('status', ['draft', 'incubating'])
        .order('updated_at', { ascending: true })

      const syncedIdeas: IdeaItem[] = error
        ? []
        : (data ?? []).map((item) => ({
            id: item.id,
            idea_type: item.idea_type,
            title: item.title,
            raw_input: item.raw_input,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            unsynced: false,
          }))

      const localUnsynced = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as IdeaItem[]
      const unsyncedReview = localUnsynced
        .filter((item) => item.status === 'draft' || item.status === 'incubating')
        .map((item) => ({ ...item, unsynced: true }))

      const merged = [...syncedIdeas, ...unsyncedReview].sort(
        (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime(),
      )

      setIdeas(merged)
      setLoading(false)
    }

    loadReviewIdeas()
  }, [])

  const summary = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    const newThisWeek = ideas.filter((item) => new Date(item.created_at) >= weekStart).length
    const incubating = ideas.filter((item) => item.status === 'incubating').length
    const draft = ideas.filter((item) => item.status === 'draft').length

    return { newThisWeek, incubating, draft }
  }, [ideas])

  const archiveIdea = async (idea: IdeaItem) => {
    if (idea.unsynced) {
      const local = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as IdeaItem[]
      const next = local.map((item) =>
        item.id === idea.id ? { ...item, status: 'archived', updated_at: new Date().toISOString() } : item,
      )
      localStorage.setItem('unsynced-ideas', JSON.stringify(next))
      setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
      return
    }

    await supabase.from('ideas').update({ status: 'archived' }).eq('id', idea.id)
    setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
  }

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 10 }}>每周回顾</h1>
      <p style={{ color: '#6B7280', marginBottom: 14 }}>
        默认按最久未更新排序，优先处理最容易被遗忘的想法。
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ padding: '6px 10px', background: '#F3F4F6', borderRadius: 999 }}>本周新增: {summary.newThisWeek}</span>
        <span style={{ padding: '6px 10px', background: '#DBEAFE', borderRadius: 999 }}>孵化中: {summary.incubating}</span>
        <span style={{ padding: '6px 10px', background: '#FDE68A', borderRadius: 999 }}>草稿: {summary.draft}</span>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : ideas.length === 0 ? (
        <p>本周没有待回顾的想法。</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {ideas.map((idea) => (
            <article key={idea.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <strong>{idea.title || '（未命名）'}</strong>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span>{IDEA_TYPE_LABEL[idea.idea_type]}</span>
                  <span>{IDEA_STATUS_LABEL[idea.status]}</span>
                  {idea.unsynced ? <span style={{ color: '#B45309' }}>未同步</span> : null}
                </div>
              </div>

              <p style={{ color: '#6B7280', margin: '8px 0' }}>{idea.raw_input.slice(0, 120)}</p>
              <small style={{ color: '#9CA3AF' }}>更新于 {new Date(idea.updated_at).toLocaleString('zh-CN')}</small>

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button type="button" onClick={() => navigate(`/idea/${idea.id}?focus=incubation`)}>
                  Continue 1 Step
                </button>
                <button type="button" onClick={() => navigate(`/idea/${idea.id}?focus=note&action=generate`)}>
                  Generate Note
                </button>
                <button type="button" onClick={() => archiveIdea(idea)}>
                  Archive
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
