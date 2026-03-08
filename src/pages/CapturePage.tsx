import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { createId } from "../lib/createId"
import { createIdeaLocalFirst, type IdeaRecord, type IdeaType } from "../services/offline"
import { generateNote } from "../services/generateNote"
import { useTheme } from "../design"

type CaptureMode = "quick" | "deep"

// Animation timing constants
const ANIMATION = {
  containerHeight: 400, // ms for container height transition
  questionStagger: 80, // ms delay between each question
  questionFadeIn: 320, // ms for question fade-in animation
} as const

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

const TYPE_CONFIG: Record<IdeaType, { label: string; placeholder: string; helper: string; icon: string }> = {
  product: {
    label: "产品",
    placeholder: "描述你的想法...比如：一个帮助用户记录心情的App",
    helper: "产品想法通常涉及解决特定问题或满足用户需求",
    icon: "◈"
  },
  creative: {
    label: "创作",
    placeholder: "描述你的创作灵感...比如：一篇关于未来城市的科幻短篇",
    helper: "创作想法可以是写作、艺术、音乐或其他形式的创意表达",
    icon: "✧"
  },
  research: {
    label: "研究",
    placeholder: "描述你的研究想法...比如：调查远程工作对生产力的影响",
    helper: "研究想法通常涉及探索某个主题、验证假设或收集数据",
    icon: "◇"
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

// Auto-resize textarea component
function AutoResizeTextarea({
  value,
  onChange,
  placeholder,
  minRows = 3,
  maxRows = 12,
  style,
  id,
  disabled,
  onFocus,
  onBlur
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  minRows?: number
  maxRows?: number
  style?: React.CSSProperties
  id?: string
  disabled?: boolean
  onFocus?: () => void
  onBlur?: () => void
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24
      const minHeight = lineHeight * minRows
      const maxHeight = lineHeight * maxRows
      const scrollHeight = textarea.scrollHeight
      textarea.style.height = `${Math.min(Math.max(scrollHeight, minHeight), maxHeight)}px`
    }
  }, [value, minRows, maxRows])

  return (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      onFocus={onFocus}
      onBlur={onBlur}
      style={{
        ...style,
        overflow: 'hidden',
        resize: 'none',
      }}
    />
  )
}

// Animated question wrapper component - smooth fade in + slide up
function AnimatedQuestion({
  children,
  index,
  isVisible,
  animationDuration,
}: {
  children: React.ReactNode
  index: number
  isVisible: boolean
  animationDuration: number
}) {
  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(16px)',
        transition: `opacity ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1), 
                     transform ${animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
        transitionDelay: isVisible ? `${index * ANIMATION.questionStagger}ms` : '0ms',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

// Progress bar component - extremely thin with subtle glow
function ProgressBar({ isActive, isDark }: { isActive: boolean; isDark: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 2,
        background: 'transparent',
        overflow: 'hidden',
        borderRadius: '0 0 14px 14px',
      }}
    >
      {/* Shimmer effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: isDark
            ? 'linear-gradient(90deg, transparent, rgba(45, 212, 191, 0.6), rgba(45, 212, 191, 0.9), rgba(45, 212, 191, 0.6), transparent)'
            : 'linear-gradient(90deg, transparent, rgba(13, 148, 136, 0.5), rgba(13, 148, 136, 0.8), rgba(13, 148, 136, 0.5), transparent)',
          animation: isActive ? 'shimmer 2s ease-in-out infinite' : 'none',
          filter: 'blur(0.5px)',
        }}
      />
      {/* Pulsing underline */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '100%',
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(45, 212, 191, 0.3) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(13, 148, 136, 0.25) 50%, transparent 100%)',
          animation: isActive ? 'pulse-underline 1.5s ease-in-out infinite' : 'none',
        }}
      />
    </div>
  )
}

// Loading animation component with enhanced visual feedback
function LoadingIndicator({ stage }: { stage: 'saving' | 'generating' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      position: 'relative',
    }}>
      {/* Orbiting particles */}
      <div style={{
        position: 'relative',
        width: 24,
        height: 24,
      }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 5,
              height: 5,
              margin: '-2.5px 0 0 -2.5px',
              borderRadius: '50%',
              background: 'currentColor',
              animation: `orbit 1.2s linear ${i * 0.4}s infinite`,
              opacity: 0.9,
            }}
          />
        ))}
        {/* Center dot */}
        <span
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: 4,
            height: 4,
            margin: '-2px 0 0 -2px',
            borderRadius: '50%',
            background: 'currentColor',
            opacity: 0.6,
          }}
        />
      </div>
      <span style={{ 
        fontSize: '0.9375rem',
        fontWeight: 500,
        letterSpacing: '0.01em',
      }}>{stage === 'saving' ? '保存中' : 'AI 思考中'}</span>
    </div>
  )
}

export default function CapturePage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme.isDark

  const [mode, setMode] = useState<CaptureMode>("quick")
  const [type, setType] = useState<IdeaType>("product")
  const [content, setContent] = useState("")
  const [deepAnswers, setDeepAnswers] = useState({
    q1: "",
    q2: "",
    q3: ""
  })
  const [submitStage, setSubmitStage] = useState<'idle' | 'saving' | 'generating'>('idle')
  const [focusedField, setFocusedField] = useState<string | null>(null)

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
    return deepAnswers.q1.trim() && deepAnswers.q2.trim() && deepAnswers.q3.trim()
  }

  const createIdea = async () => {
    if (!canSubmit()) return

    setSubmitStage('saving')

    const savedContent = content
    const savedDeepAnswers = mode === "deep" ? { ...deepAnswers } : undefined

    const idea: IdeaRecord = {
      id: createId(),
      idea_type: type,
      title: content.slice(0, 50),
      raw_input: content,
      status: "draft",
      capture_mode: mode,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (mode === "deep") {
      idea.deep_answers = deepAnswers
    }

    try {
      const { unsynced } = await createIdeaLocalFirst(idea)

      localStorage.removeItem(DRAFT_KEY)
      setContent("")
      setDeepAnswers({ q1: "", q2: "", q3: "" })

      if (!unsynced) {
        setSubmitStage('generating')

        const result = await generateNote({
          ideaId: idea.id,
          ideaType: type,
          rawInput: savedContent,
          captureMode: mode,
          deepAnswers: savedDeepAnswers
        })

        if (result.error) {
          console.error("AI 笔记生成失败:", result.error)
        }
      }

      navigate(`/idea/${idea.id}`)
    } finally {
      setSubmitStage('idle')
    }
  }

  const getInputStyle = (isFocused: boolean) => ({
    width: "100%",
    padding: 16,
    fontSize: '1rem',
    lineHeight: 1.7,
    borderRadius: 12,
    border: `1px solid ${isFocused ? theme.colors.accent.primary : theme.colors.border.default}`,
    background: isDark ? theme.colors.bg.tertiary : 'transparent',
    color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    outline: 'none',
    boxShadow: isFocused
      ? `0 0 0 3px ${isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(13, 148, 136, 0.12)'}`
      : 'none',
  })

  return (
    <section style={{ 
      maxWidth: 680, 
      margin: "0 auto",
      paddingBottom: 100, // Extra padding for mobile thumb reach
      minHeight: 'calc(100vh - 200px)'
    }}>
      {/* Page Header */}
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
            fontWeight: 600,
            color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
            marginBottom: 6,
            letterSpacing: '-0.02em'
          }}
        >
          捕获想法
        </h1>
        <p
          style={{
            fontSize: '0.9375rem',
            color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
            lineHeight: 1.6
          }}
        >
          每一个想法都值得被记住
        </p>
      </header>

      {/* Mode Toggle - Pill Switch */}
      <div
        style={{
          marginBottom: 28,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: 4,
            background: isDark ? theme.colors.bg.tertiary : '#F4F4F5',
            borderRadius: 100,
            position: 'relative',
          }}
        >
          {/* Sliding indicator */}
          <div
            style={{
              position: 'absolute',
              top: 4,
              left: mode === "quick" ? 4 : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              height: 'calc(100% - 8px)',
              background: isDark ? theme.colors.bg.secondary : '#FFFFFF',
              borderRadius: 100,
              boxShadow: isDark 
                ? '0 2px 8px rgba(0,0,0,0.3)' 
                : '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              zIndex: 0,
            }}
          />
          <button
            type="button"
            onClick={() => setMode("quick")}
            style={{
              position: 'relative',
              zIndex: 1,
              padding: "10px 28px",
              background: 'transparent',
              border: 'none',
              borderRadius: 100,
              cursor: "pointer",
              fontWeight: mode === "quick" ? 600 : 500,
              fontSize: '0.9375rem',
              color: mode === "quick"
                ? (isDark ? theme.colors.text.primary : theme.colors.text.primary)
                : (isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary),
              transition: 'color 0.2s ease'
            }}
          >
            <span style={{ marginRight: 6 }}>⚡</span>
            快速记录
          </button>
          <button
            type="button"
            onClick={() => setMode("deep")}
            style={{
              position: 'relative',
              zIndex: 1,
              padding: "10px 28px",
              background: 'transparent',
              border: 'none',
              borderRadius: 100,
              cursor: "pointer",
              fontWeight: mode === "deep" ? 600 : 500,
              fontSize: '0.9375rem',
              color: mode === "deep"
                ? (isDark ? theme.colors.text.primary : theme.colors.text.primary)
                : (isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary),
              transition: 'color 0.2s ease'
            }}
          >
            <span style={{ marginRight: 6 }}>🔮</span>
            深入孵化
          </button>
        </div>
      </div>

      {/* Main Card - Animated Container */}
      <div
        style={{
          background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: isDark 
            ? '0 4px 24px rgba(0,0,0,0.2)' 
            : '0 4px 24px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.3s ease',
        }}
      >
        {/* Type Selector */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: "block",
              marginBottom: 10,
              fontWeight: 500,
              fontSize: '0.8125rem',
              color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}
          >
            想法类型
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {(Object.keys(TYPE_CONFIG) as IdeaType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: type === t 
                    ? `2px solid ${theme.colors.accent.primary}`
                    : `1px solid ${theme.colors.border.default}`,
                  background: type === t 
                    ? (isDark ? theme.colors.accent.primaryLight : theme.colors.accent.primaryLight)
                    : 'transparent',
                  cursor: "pointer",
                  fontWeight: 500,
                  fontSize: '0.9375rem',
                  color: type === t
                    ? theme.colors.accent.primary
                    : (isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary),
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <span>{TYPE_CONFIG[t].icon}</span>
                {TYPE_CONFIG[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Input */}
        <div style={{ marginBottom: 20 }}>
          <label
            htmlFor="idea-content"
            style={{
              display: "flex",
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: isDark ? theme.colors.text.primary : theme.colors.text.primary
            }}
          >
            <span>{mode === "quick" ? "你的想法" : "描述你的想法"}</span>
            <span style={{
              fontSize: '0.75rem',
              color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
              fontWeight: 400
            }}>
              {content.length} 字
            </span>
          </label>
          <AutoResizeTextarea
            id="idea-content"
            value={content}
            onChange={setContent}
            placeholder={TYPE_CONFIG[type].placeholder}
            minRows={4}
            maxRows={10}
            disabled={submitStage !== 'idle'}
            onFocus={() => setFocusedField('content')}
            onBlur={() => setFocusedField(null)}
            style={getInputStyle(focusedField === 'content')}
          />
        </div>

        {/* Deep Mode Questions - Smooth Animated Transition */}
        <div
          style={{
            display: 'grid',
            gridTemplateRows: mode === 'deep' ? '1fr' : '0fr',
            transition: `grid-template-rows ${ANIMATION.containerHeight}ms cubic-bezier(0.16, 1, 0.3, 1)`,
            willChange: 'grid-template-rows',
          }}
        >
          <div
            style={{
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                marginTop: 24,
                paddingTop: 24,
                borderTop: `1px solid ${theme.colors.border.subtle}`,
              }}
            >
              <AnimatedQuestion
                index={0}
                isVisible={mode === 'deep'}
                animationDuration={ANIMATION.questionFadeIn}
              >
                <h3
                  style={{
                    fontSize: '0.9375rem',
                    marginBottom: 16,
                    fontWeight: 600,
                    color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <span style={{ 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    background: theme.colors.accent.primaryLight,
                    color: theme.colors.accent.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem'
                  }}>?</span>
                  回答以下问题，深化你的想法
                </h3>
              </AnimatedQuestion>
              
              {([1, 2, 3] as const).map((num) => {
                const key = `q${num}` as keyof typeof deepAnswers
                const question = DEEP_QUESTIONS[type][num - 1]
                const fieldId = `deep-answer-${num}`
                return (
                  <AnimatedQuestion
                    key={key}
                    index={num}
                    isVisible={mode === 'deep'}
                    animationDuration={ANIMATION.questionFadeIn}
                  >
                    <div style={{ marginBottom: 16 }}>
                      <label
                        htmlFor={fieldId}
                        style={{
                          display: "flex",
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 8,
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary
                        }}
                      >
                        <span style={{
                          width: 18,
                          height: 18,
                          borderRadius: 6,
                          background: isDark ? theme.colors.bg.tertiary : '#F4F4F5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary
                        }}>{num}</span>
                        {question}
                      </label>
                      <AutoResizeTextarea
                        id={fieldId}
                        value={deepAnswers[key]}
                        onChange={(val) => setDeepAnswers({ ...deepAnswers, [key]: val })}
                        placeholder="..."
                        minRows={2}
                        maxRows={6}
                        disabled={submitStage !== 'idle'}
                        onFocus={() => setFocusedField(fieldId)}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          ...getInputStyle(focusedField === fieldId),
                          fontSize: '0.9375rem'
                        }}
                      />
                    </div>
                  </AnimatedQuestion>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Action Button - Mobile Friendly */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '16px 24px',
          background: isDark 
            ? 'linear-gradient(to top, rgba(10,10,10,0.95), rgba(10,10,10,0.8))' 
            : 'linear-gradient(to top, rgba(250,250,250,0.95), rgba(250,250,250,0.8))',
          backdropFilter: 'blur(12px)',
          borderTop: `1px solid ${theme.colors.border.subtle}`,
          zIndex: 50
        }}
      >
        <div style={{ maxWidth: 632, margin: '0 auto' }}>
          {/* Main action button with magic feedback */}
          <button
            type="button"
            onClick={createIdea}
            disabled={!canSubmit() || submitStage !== 'idle'}
            style={{
              position: 'relative',
              width: '100%',
              padding: '18px 24px',
              background: canSubmit() && submitStage === 'idle'
                ? theme.colors.accent.primary
                : (isDark ? theme.colors.bg.tertiary : '#E4E4E7'),
              color: canSubmit() && submitStage === 'idle'
                ? '#FFFFFF'
                : (isDark ? theme.colors.text.tertiary : '#A1A1AA'),
              border: 'none',
              borderRadius: 14,
              cursor: canSubmit() && submitStage === 'idle' ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              fontWeight: 600,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              overflow: 'hidden',
              boxShadow: canSubmit() && submitStage === 'idle'
                ? `0 4px 16px ${isDark ? 'rgba(45, 212, 191, 0.3)' : 'rgba(13, 148, 136, 0.2)'}`
                : 'none',
            }}
          >
            {/* Breathing glow effect when processing */}
            {submitStage !== 'idle' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: isDark
                    ? 'linear-gradient(90deg, rgba(45, 212, 191, 0.1), rgba(45, 212, 191, 0.2), rgba(45, 212, 191, 0.1))'
                    : 'linear-gradient(90deg, rgba(13, 148, 136, 0.08), rgba(13, 148, 136, 0.15), rgba(13, 148, 136, 0.08))',
                  animation: 'breathe 2s ease-in-out infinite',
                }}
              />
            )}
            
            {/* Button content */}
            <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
              {submitStage === 'saving' ? (
                <LoadingIndicator stage="saving" />
              ) : submitStage === 'generating' ? (
                <LoadingIndicator stage="generating" />
              ) : (
                <>
                  <span style={{ fontSize: '1.125rem' }}>✦</span>
                  {mode === 'quick' ? '记录想法' : '生成笔记'}
                  <span style={{ 
                    marginLeft: 4,
                    opacity: 0.7,
                    transition: 'transform 0.2s ease'
                  }}>→</span>
                </>
              )}
            </span>
            
            {/* Progress bar */}
            <ProgressBar isActive={submitStage !== 'idle'} isDark={isDark} />
          </button>
          
          {/* Validation Message */}
          {mode === "deep" && !canSubmit() && content.trim() && (
            <p
              style={{
                marginTop: 10,
                fontSize: '0.8125rem',
                color: theme.colors.semantic.warning,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <span>⚠</span>
              请回答所有 3 个问题
            </p>
          )}
        </div>
      </div>

      {/* Global Styles with Enhanced Animations */}
      <style>{`
        /* Orbit animation for loading particles */
        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(8px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(8px) rotate(-360deg);
          }
        }
        
        /* Breathing glow effect */
        @keyframes breathe {
          0%, 100% {
            opacity: 0.6;
            transform: scaleX(0.95);
          }
          50% {
            opacity: 1;
            transform: scaleX(1.02);
          }
        }
        
        /* Shimmer effect for progress bar */
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        /* Pulsing underline */
        @keyframes pulse-underline {
          0%, 100% {
            opacity: 0.4;
            transform: scaleX(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scaleX(1);
          }
        }
        
        @keyframes pulse-dot {
          0%, 80%, 100% { 
            transform: scale(1);
            opacity: 0.4;
          }
          40% { 
            transform: scale(1.3);
            opacity: 1;
          }
        }
        
        textarea::placeholder {
          color: ${isDark ? theme.colors.text.tertiary : '#A1A1AA'};
        }
        
        /* Glow effect on focus */
        textarea:focus {
          border-color: ${theme.colors.accent.primary};
        }
        
        /* Button hover effect */
        button:not(:disabled):hover {
          filter: brightness(1.05);
        }
        
        button:not(:disabled):active {
          transform: scale(0.98);
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </section>
  )
}