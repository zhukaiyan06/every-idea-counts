import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"

import NotePanel from "../components/note/NotePanel"
import { StaggeredReveal } from "../components/PageTransition"
  import {
  SYNC_UPDATED_EVENT,
  loadIdeaById,
  updateIdeaLocalFirst,
  type IdeaRecord,
  type IdeaStatus,
  type IdeaType
} from "../services/offline"
import { useTheme } from "../design"
type IdeaItem = IdeaRecord & { unsynced?: boolean }

const IDEA_TYPE_LABEL: Record<IdeaType, string> = {
  product: "产品",
  creative: "创作",
  research: "研究"
}

const IDEA_STATUS_LABEL: Record<IdeaStatus, string> = {
  draft: "草稿",
  incubating: "孵化中",
  completed: "已完成",
  archived: "已归档"
}

const CAPTURE_MODE_LABEL = {
  quick: "快速记录",
  deep: "深入孵化"
}

const IDEA_STATUS_COLOR: Record<IdeaStatus, { bg: string; text: string; border: string }> = {
  draft: { bg: '#F4F4F5', text: '#52525B', border: '#E4E4E7' },
  incubating: { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' },
  completed: { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' },
  archived: { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' },
}

export default function IdeaDetailPage() {
  const { id } = useParams()
  const { theme } = useTheme()
  const isDark = theme.isDark

  const [idea, setIdea] = useState<IdeaItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadIdea = async () => {
      if (!id) {
        setError("缺少想法 ID")
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const loaded = await loadIdeaById(id)
      if (loaded) {
        setIdea(loaded)
        setLoading(false)
        return
      }

      setError("未找到该想法")
      setLoading(false)
    }

    loadIdea()
  }, [id])

  useEffect(() => {
    const handleSyncUpdate = () => {
      if (!id) return
      void loadIdeaById(id).then((loaded) => {
        if (loaded) setIdea(loaded)
      })
    }

    window.addEventListener(SYNC_UPDATED_EVENT, handleSyncUpdate)
    return () =>
      window.removeEventListener(SYNC_UPDATED_EVENT, handleSyncUpdate)
  }, [id])

  const statusStyle = useMemo(() => {
    if (!idea) return { bg: "#F3F4F6", text: "#374151", border: "#E5E7EB" }
    return IDEA_STATUS_COLOR[idea.status]
  }, [idea])

  const updateStatus = async (nextStatus: IdeaStatus) => {
    if (!idea) return

    const updatedAt = new Date().toISOString()
    const opType = nextStatus === "archived" ? "archive" : "update"
    await updateIdeaLocalFirst(
      idea,
      { status: nextStatus, updated_at: updatedAt },
      opType
    )
    setIdea((prev) =>
      prev ? { ...prev, status: nextStatus, updated_at: updatedAt } : prev
    )
  }

  const patchIdea = async (patch: Partial<IdeaItem>) => {
    if (!idea) return

    const updatedAt = patch.updated_at ?? new Date().toISOString()
    const nextPatch = { ...patch, updated_at: updatedAt }
    await updateIdeaLocalFirst(idea, nextPatch)
    setIdea((prev) => (prev ? { ...prev, ...nextPatch } : prev))
  }

  if (loading) {
    return (
      <section style={{ maxWidth: 800, margin: "0 auto", padding: 40, textAlign: 'center' }}>
        <p style={{ color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary }}>
          加载中...
        </p>
      </section>
    )
  }

  if (error || !idea) {
    return (
      <section style={{ maxWidth: 800, margin: "0 auto", padding: 40 }}>
        <h1
          style={{
            fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
            fontSize: '1.5rem',
            marginBottom: 16
          }}
        >
          想法详情
        </h1>
        <p style={{ color: theme.colors.semantic.error }}>{error || "加载失败"}</p>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: 800, margin: "0 auto" }}>
      {/* Header */}
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
            fontSize: '2rem',
            fontWeight: 600,
            marginBottom: 16,
            color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
            letterSpacing: '-0.02em',
            lineHeight: 1.3
          }}
        >
          {idea.title}
        </h1>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 16
          }}
        >
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: isDark ? theme.colors.accent.primaryLight : theme.colors.accent.primaryLight,
              color: theme.colors.accent.primary,
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            {IDEA_TYPE_LABEL[idea.idea_type]}
          </span>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 8,
              background: statusStyle.bg,
              color: statusStyle.text,
              fontSize: '0.8125rem',
              fontWeight: 500
            }}
          >
            {IDEA_STATUS_LABEL[idea.status]}
          </span>
          {idea.capture_mode && (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: isDark ? theme.colors.bg.tertiary : '#F4F4F5',
                color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
                fontSize: '0.8125rem',
                fontWeight: 500
              }}
            >
              {CAPTURE_MODE_LABEL[idea.capture_mode]}
            </span>
          )}
          {idea.unsynced && (
            <span
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: isDark ? '#78350F' : '#FEF3C7',
                color: isDark ? '#FBBF24' : '#B45309',
                fontSize: '0.8125rem',
                fontWeight: 500
              }}
            >
              未同步
            </span>
          )}
        </div>

        {/* Meta */}
        <p
          style={{
            color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
            fontSize: '0.875rem',
            marginBottom: 20
          }}
        >
          更新于 {new Date(idea.updated_at).toLocaleString("zh-CN")}
        </p>

        {/* Raw Input */}
        <div
          style={{
            padding: 20,
            background: isDark ? theme.colors.bg.tertiary : theme.colors.bg.tertiary,
            borderRadius: 12,
            marginBottom: 20
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
              marginBottom: 8
            }}
          >
            原始输入
          </label>
          <p
            style={{
              color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
              fontSize: '0.9375rem',
              lineHeight: 1.6,
              margin: 0
            }}
          >
            {idea.raw_input}
          </p>
        </div>

        {/* Status Actions */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="button"
            onClick={() => updateStatus("incubating")}
            style={{
              padding: "10px 18px",
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: 10,
              background: isDark ? theme.colors.bg.secondary : 'transparent',
              color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
              cursor: "pointer",
              fontSize: '0.9375rem',
              fontWeight: 500,
              transition: 'all 150ms ease'
            }}
          >
            标记为孵化中
          </button>
          <button
            type="button"
            onClick={() => updateStatus("completed")}
            style={{
              padding: "10px 18px",
              border: `1px solid ${theme.colors.border.default}`,
              borderRadius: 10,
              background: isDark ? theme.colors.bg.secondary : 'transparent',
              color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
              cursor: "pointer",
              fontSize: '0.9375rem',
              fontWeight: 500,
              transition: 'all 150ms ease'
            }}
          >
            标记为完成
          </button>
          <button
            type="button"
            onClick={() => updateStatus("archived")}
            style={{
              padding: "10px 18px",
              border: `1px solid ${isDark ? '#7F1D1D' : '#FEE2E2'}`,
              borderRadius: 10,
              background: 'transparent',
              color: isDark ? '#F87171' : theme.colors.semantic.error,
              cursor: "pointer",
              fontSize: '0.9375rem',
              fontWeight: 500,
              transition: 'all 150ms ease'
            }}
          >
            归档
          </button>
        </div>
      </header>

      {/* Note Panel */}
      <div
        style={{
          background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: 16,
          padding: 28,
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.2)' : '0 4px 24px rgba(0,0,0,0.04)'
        }}
      >
        <NotePanel
          idea={{
            id: idea.id,
            idea_type: idea.idea_type,
            raw_input: idea.raw_input,
            capture_mode: idea.capture_mode,
            deep_answers: idea.deep_answers,
            final_note: idea.final_note
          }}
          onPatchIdea={async (patch) => {
            await patchIdea(patch)
          }}
        />
      </div>
    </section>
  )
}