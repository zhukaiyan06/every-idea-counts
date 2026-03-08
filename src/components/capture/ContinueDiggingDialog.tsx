import { useState } from "react"
import { supabase } from "../../lib/supabase"
import { useTheme } from "../../design"

type IdeaType = "product" | "creative" | "research"

interface ContinueDiggingDialogProps {
  ideaId: string
  ideaType: IdeaType
  rawInput: string
  currentNote: string
  onClose: () => void
  onUpdateNote: (newContent: string) => void
}

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function ContinueDiggingDialog({
  ideaId,
  ideaType,
  rawInput,
  currentNote,
  onClose,
  onUpdateNote
}: ContinueDiggingDialogProps) {
  const { theme } = useTheme()
  const isDark = theme.isDark

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = { role: "user", content: input.trim() }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const { data, error } = await supabase.functions.invoke("ai_ask", {
        body: {
          idea_id: ideaId,
          idea_type: ideaType,
          raw_input: rawInput,
          user_question: userMessage.content
        }
      })

      if (error) {
        console.error("AI ask error:", error)
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "抱歉，AI 服务暂时不可用。请稍后重试。" }
        ])
      } else {
        const assistantMessage: Message = {
          role: "assistant",
          content: data.answer || "抱歉，没有收到有效回复。"
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，发送消息失败。请稍后重试。" }
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateNote = async () => {
    if (messages.length === 0) return

    setIsUpdating(true)
    try {
      const conversationMd = messages
        .map((msg) => {
          const prefix = msg.role === "user" ? "**问：**" : "**答：**"
          return `${prefix}${msg.content}`
        })
        .join("\n\n")

      const newSection = `\n\n---\n## 🔄 继续深入挖掘 (${new Date().toLocaleString("zh-CN")})\n\n${conversationMd}`

      const updatedNote = currentNote.trim()
        ? `${currentNote}\n${newSection}`
        : newSection

      onUpdateNote(updatedNote)
      setMessages([])
      onClose()
    } catch (error) {
      console.error("Failed to update note:", error)
      alert("更新笔记失败，请重试")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: isDark ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
        backdropFilter: 'blur(4px)',
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 300,
        padding: 20
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
          borderRadius: 20,
          width: "100%",
          maxWidth: 640,
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: isDark 
            ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
            : "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "20px 24px",
            borderBottom: `1px solid ${theme.colors.border.subtle}`,
            flexShrink: 0
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: isDark ? theme.colors.text.primary : theme.colors.text.primary
            }}
          >
            继续深入挖掘
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭"
            style={{
              background: "none",
              border: "none",
              fontSize: 24,
              cursor: "pointer",
              color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
              padding: 0,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 8,
              transition: 'all 150ms ease'
            }}
          >
            ×
          </button>
        </div>

        {/* Chat Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 20,
            background: isDark ? theme.colors.bg.primary : theme.colors.bg.primary,
            minHeight: 300,
            maxHeight: 400
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary
              }}
            >
              <p style={{ marginBottom: 8, fontSize: '1rem' }}>
                开始与 AI 对话，深入探索你的想法
              </p>
              <p style={{ fontSize: '0.875rem' }}>
                提出问题，获得洞察，更新笔记
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                }}
              >
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "12px 18px",
                    borderRadius: 16,
                    background: msg.role === "user"
                      ? theme.colors.accent.primary
                      : (isDark ? theme.colors.bg.tertiary : '#F4F4F5'),
                    color: msg.role === "user"
                      ? '#FFFFFF'
                      : (isDark ? theme.colors.text.primary : theme.colors.text.primary),
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    borderBottomRightRadius: msg.role === "user" ? 4 : 16,
                    borderBottomLeftRadius: msg.role === "assistant" ? 4 : 16
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div
              style={{
                textAlign: "center",
                color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
                padding: '8px 0'
              }}
            >
              <span style={{ animation: 'pulse 1.5s ease-in-out infinite' }}>
                AI 正在思考...
              </span>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: `1px solid ${theme.colors.border.subtle}`,
            background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
            flexShrink: 0
          }}
        >
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入你的问题..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 12,
                border: `1px solid ${theme.colors.border.default}`,
                background: isDark ? theme.colors.bg.tertiary : 'transparent',
                color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 150ms ease'
              }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              style={{
                padding: "12px 20px",
                background: theme.colors.accent.primary,
                color: "white",
                border: "none",
                borderRadius: 12,
                cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                opacity: input.trim() && !isLoading ? 1 : 0.5,
                fontWeight: 500,
                fontSize: '0.9375rem',
                transition: 'all 150ms ease'
              }}
            >
              发送
            </button>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 18px",
                border: `1px solid ${theme.colors.border.default}`,
                borderRadius: 10,
                background: 'transparent',
                color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
                cursor: "pointer",
                fontWeight: 500,
                fontSize: '0.9375rem',
                transition: 'all 150ms ease'
              }}
            >
              关闭
            </button>
            <button
              type="button"
              onClick={handleUpdateNote}
              disabled={messages.length === 0 || isUpdating}
              style={{
                padding: "10px 18px",
                background: theme.colors.accent.primary,
                color: "white",
                border: "none",
                borderRadius: 10,
                cursor: messages.length > 0 && !isUpdating ? "pointer" : "not-allowed",
                opacity: messages.length > 0 && !isUpdating ? 1 : 0.5,
                fontWeight: 500,
                fontSize: '0.9375rem',
                transition: 'all 150ms ease'
              }}
            >
              {isUpdating ? "更新中..." : "更新笔记"}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        input::placeholder {
          color: ${isDark ? theme.colors.text.tertiary : '#A1A1AA'};
        }
        input:focus {
          border-color: ${theme.colors.accent.primary};
        }
      `}</style>
    </div>
  )
}