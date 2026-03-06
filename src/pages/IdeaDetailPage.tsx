import { useEffect, useMemo, useState } from "react"
import { useParams } from "react-router-dom"

import NotePanel from "../components/note/NotePanel"
import {
  SYNC_UPDATED_EVENT,
  loadIdeaById,
  updateIdeaLocalFirst,
  type IdeaRecord,
  type IdeaStatus,
  type IdeaType
} from "../services/offline"

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

export default function IdeaDetailPage() {
  const { id } = useParams()
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
    if (!idea) return { color: "#374151", bg: "#F3F4F6" }
    if (idea.status === "draft") return { color: "#1F2937", bg: "#F3F4F6" }
    if (idea.status === "incubating")
      return { color: "#1D4ED8", bg: "#DBEAFE" }
    if (idea.status === "completed") return { color: "#065F46", bg: "#D1FAE5" }
    return { color: "#92400E", bg: "#FEF3C7" }
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
    return <section style={{ padding: 20 }}>加载中...</section>
  }

  if (error || !idea) {
    return (
      <section style={{ padding: 20 }}>
        <h1>想法详情</h1>
        <p style={{ color: "#B91C1C" }}>{error || "加载失败"}</p>
      </section>
    )
  }

  return (
    <section style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 8, fontSize: 28 }}>{idea.title}</h1>

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: 12
          }}
        >
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 999,
              background: "#EEF2FF",
              color: "#3730A3",
              fontSize: 14
            }}
          >
            {IDEA_TYPE_LABEL[idea.idea_type]}
          </span>
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 999,
              background: statusStyle.bg,
              color: statusStyle.color,
              fontSize: 14
            }}
          >
            {IDEA_STATUS_LABEL[idea.status]}
          </span>
          {idea.capture_mode && (
            <span
              style={{
                padding: "4px 12px",
                borderRadius: 999,
                background: "#F3F4F6",
                color: "#6B7280",
                fontSize: 13
              }}
            >
              {CAPTURE_MODE_LABEL[idea.capture_mode]}
            </span>
          )}
          {idea.unsynced ? (
            <span style={{ color: "#B45309", fontSize: 13 }}>未同步</span>
          ) : null}
        </div>

        <p style={{ color: "#6B7280", fontSize: 14, marginBottom: 16 }}>
          更新于 {new Date(idea.updated_at).toLocaleString("zh-CN")}
        </p>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => updateStatus("incubating")}
            style={{
              padding: "8px 16px",
              border: "1px solid #D1D5DB",
              borderRadius: 4,
              background: "white",
              cursor: "pointer"
            }}
          >
            标记为孵化中
          </button>
          <button
            type="button"
            onClick={() => updateStatus("completed")}
            style={{
              padding: "8px 16px",
              border: "1px solid #D1D5DB",
              borderRadius: 4,
              background: "white",
              cursor: "pointer"
            }}
          >
            标记为完成
          </button>
          <button
            type="button"
            onClick={() => updateStatus("archived")}
            style={{
              padding: "8px 16px",
              border: "1px solid #D1D5DB",
              borderRadius: 4,
              background: "white",
              cursor: "pointer"
            }}
          >
            归档
          </button>
        </div>
      </header>

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
    </section>
  )
}