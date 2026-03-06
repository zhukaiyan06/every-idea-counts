import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createIdeaLocalFirst, type IdeaRecord, type IdeaType } from "../services/offline"
import { generateNote } from "../services/generateNote"

type CaptureMode = "quick" | "deep"

interface Draft {
  mode: CaptureMode
  type: IdeaType
  content: string
  deepAnswers?: {
    q1: string
    q2: string
    q3: string
  }
}

const TYPE_CONFIG: Record<IdeaType, { label: string; placeholder: string; helper: string }> = {
  product: {
    label: "产品",
    placeholder: "描述你的想法...比如：一个帮助用户记录心情的App",
    helper: "产品想法通常涉及解决特定问题或满足用户需求。"
  },
  creative: {
    label: "创作",
    placeholder: "描述你的创作灵感...比如：一篇关于未来城市的科幻短篇",
    helper: "创作想法可以是写作、艺术、音乐或其他形式的创意表达。"
  },
  research: {
    label: "研究",
    placeholder: "描述你的研究想法...比如：调查远程工作对生产力的影响",
    helper: "研究想法通常涉及探索某个主题、验证假设或收集数据。"
  }
}

const DEEP_QUESTIONS: Record<IdeaType, [string, string, string]> = {
  product: [
    "这个想法为哪些用户解决什么问题？",
    "用户在什么场景下会使用？",
    "他们现在怎么解决这个问题？"
  ],
  creative: [
    "主题或核心信息是什么？",
    "目标受众是谁？为什么感兴趣？",
    "有什么参考作品或灵感来源？"
  ],
  research: [
    "想探索或验证什么问题？",
    "打算用什么方法研究？",
    "已有相关研究有哪些？"
  ]
}

const DRAFT_KEY = "every-idea-counts-draft"

export default function CapturePage() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<CaptureMode>("quick")
  const [type, setType] = useState<IdeaType>("product")
  const [content, setContent] = useState("")
  const [deepAnswers, setDeepAnswers] = useState({
    q1: "",
    q2: "",
    q3: ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)


  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const draft: Draft = JSON.parse(saved)
        setMode(draft.mode)
        setType(draft.type)
        setContent(draft.content)
        if (draft.deepAnswers) {
          setDeepAnswers(draft.deepAnswers)
        }
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save draft with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      const draft: Draft = { mode, type, content }
      if (mode === "deep") {
        draft.deepAnswers = deepAnswers
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }, 1000)
    return () => clearTimeout(timeout)
  }, [mode, type, content, deepAnswers])

  const canSubmit = () => {
    if (!content.trim()) return false
    if (mode === "quick") return true
    // Deep mode requires all 3 questions answered
    return deepAnswers.q1.trim() && deepAnswers.q2.trim() && deepAnswers.q3.trim()
  }

  const createIdea = async () => {
    if (!canSubmit()) return

    setIsSubmitting(true)

    const idea: IdeaRecord = {
      id: crypto.randomUUID(),
      idea_type: type,
      title: content.slice(0, 50),
      raw_input: content,
      status: "draft",
      capture_mode: mode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Add deep answers for deep mode
    if (mode === "deep") {
      idea.deep_answers = deepAnswers
    }

    try {
      await createIdeaLocalFirst(idea)

      // Generate note via Edge Function
      const result = await generateNote({
        ideaId: idea.id,
        ideaType: type,
        rawInput: content,
        captureMode: mode,
        deepAnswers: mode === "deep" ? deepAnswers : undefined
      })

      if (result.error) {
        // Note generation failed, but idea was saved
        console.error("Note generation failed:", result.error)
        // Still navigate to detail page - user can retry later
      }

      // Clear draft
      localStorage.removeItem(DRAFT_KEY)
      setContent("")
      setDeepAnswers({ q1: "", q2: "", q3: "" })

      // Navigate to idea detail page
      navigate(`/idea/${idea.id}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section style={{ maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>捕获想法</h1>

      {/* Mode Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setMode("quick")}
          style={{
            padding: "12px 24px",
            border: mode === "quick" ? "2px solid #4F46E5" : "1px solid #ccc",
            borderBottom: mode === "quick" ? "2px solid white" : undefined,
            background: mode === "quick" ? "white" : "#F9FAFB",
            cursor: "pointer",
            borderRadius: "4px 4px 0 0",
            fontWeight: mode === "quick" ? 600 : 400,
            marginBottom: -1,
            zIndex: mode === "quick" ? 1 : 0
          }}
        >
          快速记录
        </button>
        <button
          type="button"
          onClick={() => setMode("deep")}
          style={{
            padding: "12px 24px",
            border: mode === "deep" ? "2px solid #4F46E5" : "1px solid #ccc",
            borderBottom: mode === "deep" ? "2px solid white" : undefined,
            background: mode === "deep" ? "white" : "#F9FAFB",
            cursor: "pointer",
            borderRadius: "4px 4px 0 0",
            fontWeight: mode === "deep" ? 600 : 400,
            marginBottom: -1,
            zIndex: mode === "deep" ? 1 : 0
          }}
        >
          深入孵化
        </button>
      </div>

      {/* Content Panel */}
      <div style={{ border: "2px solid #4F46E5", borderRadius: "0 4px 4px 4px", padding: 24 }}>
        {/* Type Selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            想法类型
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            {(Object.keys(TYPE_CONFIG) as IdeaType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 4,
                  border: type === t ? "2px solid #4F46E5" : "1px solid #ccc",
                  background: type === t ? "#EEF2FF" : "white",
                  cursor: "pointer"
                }}
              >
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Helper Text */}
        <p style={{ color: "#666", marginBottom: 12, fontSize: 14 }}>
          {TYPE_CONFIG[type].helper}
        </p>

        {/* Main Input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
            {mode === "quick" ? "你的想法" : "描述你的想法"}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={TYPE_CONFIG[type].placeholder}
            rows={6}
            style={{
              width: "100%",
              padding: 12,
              fontSize: 16,
              borderRadius: 4,
              border: "1px solid #ccc",
              resize: "vertical"
            }}
          />
        </div>

        {/* Deep Mode Questions */}
        {mode === "deep" && (
          <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #E5E7EB" }}>
            <h3 style={{ fontSize: 16, marginBottom: 16, fontWeight: 600 }}>
              回答以下问题，帮助深化你的想法
            </h3>
            {([1, 2, 3] as const).map((num) => {
              const key = `q${num}` as keyof typeof deepAnswers
              const question = DEEP_QUESTIONS[type][num - 1]
              return (
                <div key={key} style={{ marginBottom: 20 }}>
                  <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                    {question}
                  </label>
                  <textarea
                    value={deepAnswers[key]}
                    onChange={(e) =>
                      setDeepAnswers({ ...deepAnswers, [key]: e.target.value })
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: 12,
                      fontSize: 16,
                      borderRadius: 4,
                      border: "1px solid #ccc",
                      resize: "vertical"
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}



        {/* Action Button */}
        <button
          type="button"
          onClick={createIdea}
          disabled={!canSubmit() || isSubmitting}
          style={{
            padding: "12px 24px",
            background: "#4F46E5",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: canSubmit() && !isSubmitting ? "pointer" : "not-allowed",
            opacity: canSubmit() && !isSubmitting ? 1 : 0.5,
            fontSize: 16,
            fontWeight: 600
          }}
        >
          {isSubmitting
            ? "提交中..."
            : mode === "quick"
            ? "记录想法 →"
            : "生成笔记 →"}
        </button>

        {mode === "deep" && !canSubmit() && content.trim() && (
          <p style={{ marginTop: 8, fontSize: 14, color: "#DC2626" }}>
            请回答所有3个问题后再提交
          </p>
        )}
      </div>
    </section>
  )
}