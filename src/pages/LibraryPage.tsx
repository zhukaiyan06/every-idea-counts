import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { supabase } from '../lib/supabase'

type IdeaType = 'product' | 'creative' | 'research'
type IdeaStatus = 'draft' | 'incubating' | 'completed' | 'archived'
type SortOption = 'updated_desc' | 'updated_asc' | 'created_desc'

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

function compareIdeas(a: IdeaItem, b: IdeaItem, sort: SortOption) {
  if (sort === 'updated_desc') {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  }
  if (sort === 'updated_asc') {
    return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
  }
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export default function LibraryPage() {
  const navigate = useNavigate()
  const [ideas, setIdeas] = useState<IdeaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | IdeaStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | IdeaType>('all')
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc')
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    const loadIdeas = async () => {
      setLoading(true)

      const localUnsynced = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as IdeaItem[]

      const { data, error } = await supabase
        .from('ideas')
        .select('id, idea_type, title, raw_input, status, created_at, updated_at')

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

      const unsyncedIdeas: IdeaItem[] = localUnsynced.map((item) => ({
        ...item,
        unsynced: true,
      }))

      const merged = [...syncedIdeas, ...unsyncedIdeas]
      setIdeas(merged)
      setLoading(false)
    }

    loadIdeas()
  }, [])

  const filteredIdeas = useMemo(() => {
    let result = ideas

    if (!showArchived) {
      result = result.filter((item) => item.status !== 'archived')
    }

    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter)
    }

    if (typeFilter !== 'all') {
      result = result.filter((item) => item.idea_type === typeFilter)
    }

    if (search.trim()) {
      const keyword = search.toLowerCase()
      result = result.filter((item) => {
        const text = `${item.title} ${item.raw_input}`.toLowerCase()
        return text.includes(keyword)
      })
    }

    return [...result].sort((a, b) => compareIdeas(a, b, sortBy))
  }, [ideas, showArchived, statusFilter, typeFilter, search, sortBy])

  const handleArchive = async (idea: IdeaItem) => {
    if (idea.unsynced) {
      const local = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as IdeaItem[]
      const next = local.map((item) =>
        item.id === idea.id ? { ...item, status: 'archived', updated_at: new Date().toISOString() } : item,
      )
      localStorage.setItem('unsynced-ideas', JSON.stringify(next))
      setIdeas((prev) => prev.map((item) => (item.id === idea.id ? { ...item, status: 'archived' } : item)))
      return
    }

    await supabase.from('ideas').update({ status: 'archived' }).eq('id', idea.id)
    setIdeas((prev) =>
      prev.map((item) => (item.id === idea.id ? { ...item, status: 'archived', updated_at: new Date().toISOString() } : item)),
    )
  }

  const handleDelete = async (idea: IdeaItem) => {
    if (idea.unsynced) {
      const local = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]') as IdeaItem[]
      const next = local.filter((item) => item.id !== idea.id)
      localStorage.setItem('unsynced-ideas', JSON.stringify(next))
      setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
      return
    }

    await supabase.from('ideas').delete().eq('id', idea.id)
    setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
  }

  return (
    <section style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>想法库</h1>

      <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索想法、笔记、行动项..."
          style={{ padding: 10, border: '1px solid #ccc', borderRadius: 6 }}
        />

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | IdeaStatus)}>
            <option value="all">全部状态</option>
            <option value="draft">草稿</option>
            <option value="incubating">孵化中</option>
            <option value="completed">已完成</option>
            <option value="archived">已归档</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as 'all' | IdeaType)}>
            <option value="all">全部类型</option>
            <option value="product">产品</option>
            <option value="creative">创作</option>
            <option value="research">研究</option>
          </select>

          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <option value="updated_desc">最近更新</option>
            <option value="updated_asc">最久未更新</option>
            <option value="created_desc">最近创建</option>
          </select>

          <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            显示已归档
          </label>
        </div>
      </div>

      {loading ? (
        <p>加载中...</p>
      ) : filteredIdeas.length === 0 ? (
        <p>暂无想法，去“捕获”页面创建第一条吧。</p>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredIdeas.map((idea) => (
            <article
              key={idea.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: 8,
                padding: 14,
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <strong>{idea.title || '（未命名）'}</strong>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>{IDEA_TYPE_LABEL[idea.idea_type]}</span>
                  <span>{IDEA_STATUS_LABEL[idea.status]}</span>
                  {idea.unsynced ? <span style={{ color: '#B45309' }}>未同步</span> : null}
                </div>
              </div>

              <p style={{ color: '#666', margin: '8px 0' }}>{idea.raw_input.slice(0, 120)}</p>
              <small style={{ color: '#999' }}>
                更新于 {new Date(idea.updated_at).toLocaleString('zh-CN')}
              </small>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button type="button" onClick={() => navigate(`/idea/${idea.id}?focus=incubation`)}>
                  Continue 1 Step
                </button>
                <button type="button" onClick={() => handleArchive(idea)}>
                  归档
                </button>
                <button type="button" onClick={() => handleDelete(idea)}>
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
