import { useEffect, useMemo, useState } from 'react'

import { supabase } from '../../lib/supabase'

type IdeaType = 'product' | 'creative' | 'research'
type StageKey = 'problem_definition' | 'target_audience' | 'unique_value' | 'execution_steps' | 'risk_assessment'

interface IdeaData {
  id: string
  idea_type: IdeaType
  raw_input: string
  current_state?: string | null
  turn_count_in_state?: number | null
  collected?: Record<string, string> | null
  unsynced?: boolean
}

interface IncubationPanelProps {
  idea: IdeaData
  onPatchIdea: (patch: {
    current_state?: string
    turn_count_in_state?: number
    collected?: Record<string, string>
    status?: 'draft' | 'incubating' | 'completed' | 'archived'
    updated_at?: string
  }) => Promise<void>
  onGenerateNote?: () => void
}

interface MessageItem {
  role: 'assistant' | 'user'
  mode: 'stage' | 'ask'
  content: string
}

const STAGE_ORDER: StageKey[] = [
  'problem_definition',
  'target_audience',
  'unique_value',
  'execution_steps',
  'risk_assessment',
]

const STAGE_LABEL: Record<StageKey, string> = {
  problem_definition: 'Problem',
  target_audience: 'Audience',
  unique_value: 'Value',
  execution_steps: 'Steps',
  risk_assessment: 'Risk',
}

const STAGE_GOAL: Record<StageKey, string> = {
  problem_definition: '把想法说清楚：为谁，在什么场景，解决什么。',
  target_audience: '选定第一优先对象：一个具体用户画像。',
  unique_value: '写出对比句：相对现有方案，你到底强在哪。',
  execution_steps: '落到证据：一周内能验证的最小步骤。',
  risk_assessment: '找最大不确定性：怎么最低成本降低它。',
}

const STAGE_QUESTION: Record<StageKey, string> = {
  problem_definition: '你希望这个想法为哪一类人解决什么具体问题？',
  target_audience: '你最先要服务的那类用户是谁，他们现在用什么替代方案？',
  unique_value: '相对现有方案，你的独特价值具体是什么？',
  execution_steps: '你下一周能做的最小验证步骤是什么？',
  risk_assessment: '最大的风险是什么，你怎么最小成本降低它？',
}

function normalizeState(state?: string | null): StageKey {
  if (!state) return 'problem_definition'
  if (STAGE_ORDER.includes(state as StageKey)) return state as StageKey
  return 'problem_definition'
}

function toSentenceLimited(text: string, max = 3): string {
  const parts = text
    .split(/[。！？.!?]/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length === 0) return ''
  return `${parts.slice(0, max).join('。')}。`.replace(/[?？]/g, '')
}

export default function IncubationPanel({ idea, onPatchIdea, onGenerateNote }: IncubationPanelProps) {
  const [mode, setMode] = useState<'answer' | 'ask'>('answer')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<MessageItem[]>([])

  const [currentState, setCurrentState] = useState<StageKey>(normalizeState(idea.current_state))
  const [turnCount, setTurnCount] = useState<number>(idea.turn_count_in_state ?? 0)
  const [collected, setCollected] = useState<Record<string, string>>(idea.collected ?? {})

  const [stageReadyToAdvance, setStageReadyToAdvance] = useState(false)
  const [hasCompletedOneStage, setHasCompletedOneStage] = useState(false)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionPaused, setSessionPaused] = useState(false)

  useEffect(() => {
    const state = normalizeState(idea.current_state)
    setCurrentState(state)
    setTurnCount(idea.turn_count_in_state ?? 0)
    setCollected(idea.collected ?? {})
    setStageReadyToAdvance(false)
    setMessages([{ role: 'assistant', mode: 'stage', content: STAGE_QUESTION[state] }])
    setHasCompletedOneStage(false)
    setShowSessionModal(false)
    setSessionPaused(false)
  }, [idea.current_state, idea.turn_count_in_state, idea.collected])

  const stageIndex = useMemo(() => STAGE_ORDER.indexOf(currentState), [currentState])

  const persistState = async (
    patch: Partial<{
      current_state: string
      turn_count_in_state: number
      collected: Record<string, string>
      status: 'draft' | 'incubating' | 'completed' | 'archived'
    }>,
  ) => {
    await onPatchIdea({ ...patch, updated_at: new Date().toISOString() })
  }

  const handleAnswerSubmit = async () => {
    if (!input.trim() || loading || sessionPaused) return

    const userText = input.trim()
    const nextCollected = { ...collected, [currentState]: userText }

    setMessages((prev) => [...prev, { role: 'user', mode: 'stage', content: userText }])
    setInput('')
    setLoading(true)

    let action: 'FOLLOW_UP' | 'ADVANCE' = 'FOLLOW_UP'
    let question = STAGE_QUESTION[currentState]

    const { data, error } = await supabase.functions.invoke('ai_router', {
      body: {
        idea_id: idea.id,
        idea_type: idea.idea_type,
        current_state: currentState,
        current_state_goal: STAGE_GOAL[currentState],
        current_step_index: stageIndex + 1,
        turn_count_in_state: turnCount,
        raw_input: idea.raw_input,
        user_latest_reply: userText,
      },
    })

    if (!error && data?.question) {
      question = String(data.question)
      action = data.action === 'ADVANCE' ? 'ADVANCE' : 'FOLLOW_UP'
    }

    const nextTurn = turnCount + 1
    const forcedAdvance = nextTurn >= 2
    const canAdvance = action === 'ADVANCE' || forcedAdvance

    setMessages((prev) => [...prev, { role: 'assistant', mode: 'stage', content: question }])
    setTurnCount(nextTurn)
    setCollected(nextCollected)
    setStageReadyToAdvance(canAdvance)

    await persistState({
      current_state: currentState,
      turn_count_in_state: nextTurn,
      collected: nextCollected,
      status: 'incubating',
    })

    setLoading(false)
  }

  const handleAskSubmit = async () => {
    if (!input.trim() || loading || sessionPaused) return

    const userQuestion = input.trim()
    setMessages((prev) => [...prev, { role: 'user', mode: 'ask', content: userQuestion }])
    setInput('')
    setLoading(true)

    const { data, error } = await supabase.functions.invoke('ai_ask', {
      body: {
        idea_id: idea.id,
        current_state: currentState,
        current_state_goal: STAGE_GOAL[currentState],
        idea_type: idea.idea_type,
        raw_input: idea.raw_input,
        user_question: userQuestion,
      },
    })

    const answer = !error && data?.answer ? String(data.answer) : toSentenceLimited('目前无法连接 AI，请稍后重试。')

    setMessages((prev) => [...prev, { role: 'assistant', mode: 'ask', content: answer }])
    setMode('answer')
    setMessages((prev) => [...prev, { role: 'assistant', mode: 'stage', content: STAGE_QUESTION[currentState] }])
    setLoading(false)
  }

  const handleSend = async () => {
    if (mode === 'ask') {
      await handleAskSubmit()
      return
    }
    await handleAnswerSubmit()
  }

  const handleSkip = async () => {
    if (loading) return
    const skipped = { ...collected, [currentState]: '（待补充：用户选择跳过本阶段）' }
    setCollected(skipped)
    setStageReadyToAdvance(true)

    await persistState({
      current_state: currentState,
      turn_count_in_state: turnCount,
      collected: skipped,
      status: 'incubating',
    })
  }

  const handleContinue = async () => {
    if (!stageReadyToAdvance || loading) return

    const nextIndex = stageIndex + 1
    if (nextIndex >= STAGE_ORDER.length) {
      await persistState({
        current_state: currentState,
        turn_count_in_state: turnCount,
        collected,
        status: 'completed',
      })
      return
    }

    const nextState = STAGE_ORDER[nextIndex]
    setCurrentState(nextState)
    setTurnCount(0)
    setStageReadyToAdvance(false)
    setMessages([{ role: 'assistant', mode: 'stage', content: STAGE_QUESTION[nextState] }])

    await persistState({
      current_state: nextState,
      turn_count_in_state: 0,
      collected,
      status: 'incubating',
    })

    if (!hasCompletedOneStage) {
      setHasCompletedOneStage(true)
      setShowSessionModal(true)
      setSessionPaused(true)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {STAGE_ORDER.map((stage, index) => (
          <span
            key={stage}
            style={{
              padding: '4px 8px',
              borderRadius: 999,
              background: stage === currentState ? '#DBEAFE' : '#F3F4F6',
              color: stage === currentState ? '#1D4ED8' : '#6B7280',
              fontSize: 12,
            }}
          >
            {index + 1}. {STAGE_LABEL[stage]}
          </span>
        ))}
      </div>

      <div style={{ marginBottom: 8, color: '#374151', fontSize: 14 }}>
        Stage {stageIndex + 1}/5 目标：{STAGE_GOAL[currentState]}
      </div>

      <div style={{ marginBottom: 10, display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setMode('answer')} disabled={loading}>
          Answer
        </button>
        <button type="button" onClick={() => setMode('ask')} disabled={loading}>
          Ask AI
        </button>
      </div>

      <div style={{ border: '1px solid #E5E7EB', borderRadius: 8, padding: 10, marginBottom: 10, minHeight: 120 }}>
        {messages.map((msg, idx) => (
          <div key={`${msg.role}-${idx}`} style={{ marginBottom: 8 }}>
            <strong>{msg.role === 'assistant' ? (msg.mode === 'ask' ? 'AI 回答' : 'AI 问题') : (msg.mode === 'ask' ? '你的提问' : '你的回答')}：</strong>
            <span>{msg.content}</span>
          </div>
        ))}
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={mode === 'ask' ? '输入你要咨询 AI 的问题' : '用一句话回答，越具体越好。'}
        rows={3}
        style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, marginBottom: 10 }}
      />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={handleSend} disabled={loading || !input.trim() || sessionPaused}>
          {loading ? '处理中...' : 'Send'}
        </button>
        <button type="button" onClick={handleSkip} disabled={loading || sessionPaused}>
          Skip
        </button>
        <button type="button" onClick={onGenerateNote} disabled={loading}>
          Generate Note
        </button>
        <button type="button" onClick={handleContinue} disabled={loading || !stageReadyToAdvance}>
          Continue
        </button>
      </div>

      {stageReadyToAdvance ? <p style={{ marginTop: 10, color: '#065F46' }}>看起来足够清晰了，可以继续下一阶段。</p> : null}
      {sessionPaused ? <p style={{ marginTop: 8, color: '#6B7280' }}>本次已推进 1 步。继续按钮可随时进入下一阶段。</p> : null}

      {showSessionModal ? (
        <div style={{ marginTop: 12, border: '1px solid #BFDBFE', background: '#EFF6FF', borderRadius: 8, padding: 12 }}>
          <p style={{ margin: 0 }}>本次已推进 1 步。要继续孵化下一阶段吗？</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => {
                setSessionPaused(false)
                setShowSessionModal(false)
              }}
            >
              Continue
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSessionModal(false)
                setSessionPaused(true)
              }}
            >
              Not now
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
