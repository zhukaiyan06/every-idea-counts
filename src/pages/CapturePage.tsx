import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

type IdeaType = 'product' | 'creative' | 'research'

interface Draft {
  type: IdeaType
  content: string
}

const TYPE_CONFIG: Record<IdeaType, { label: string; placeholder: string; helper: string }> = {
  product: {
    label: '产品想法',
    placeholder: '描述你的产品想法...比如：一个帮助用户记录每日心情的App',
    helper: '产品想法通常涉及解决特定问题或满足用户需求。'
  },
  creative: {
    label: '创作想法',
    placeholder: '描述你的创作想法...比如：一篇关于未来城市的科幻短篇小说',
    helper: '创作想法可以是写作、艺术、音乐或其他形式的创意表达。'
  },
  research: {
    label: '研究想法',
    placeholder: '描述你的研究想法...比如：调查远程工作对生产力的影响',
    helper: '研究想法通常涉及探索某个主题、验证假设或收集数据。'
  }
}

const DRAFT_KEY = 'every-idea-counts-draft'

export default function CapturePage() {
  const navigate = useNavigate()
  const [type, setType] = useState<IdeaType>('product')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  // Load draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const draft: Draft = JSON.parse(saved)
        setType(draft.type)
        setContent(draft.content)
      } catch {
        // Ignore parse errors
      }
    }
  }, [])

  // Save draft with debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      const draft: Draft = { type, content }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    }, 1000)
    return () => clearTimeout(timeout)
  }, [type, content])

  const createIdea = async (shouldNavigate: boolean) => {
    if (!content.trim()) return
    
    setIsSubmitting(true)
    
    const idea = {
      id: crypto.randomUUID(),
      idea_type: type,
      title: content.slice(0, 50),
      raw_input: content,
      status: 'draft',
      current_state: type === 'product' ? 'problem_validation' : type === 'creative' ? 'concept_clarification' : 'question_definition',
      turn_count_in_state: 0,
      collected: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    try {
      // Try to save to Supabase
      const { error } = await supabase.from('ideas').insert(idea)
      
      if (error) {
        console.error('Failed to save idea:', error)
        // Store locally if failed
        const unsynced = JSON.parse(localStorage.getItem('unsynced-ideas') || '[]')
        unsynced.push(idea)
        localStorage.setItem('unsynced-ideas', JSON.stringify(unsynced))
      }
      
      // Clear draft
      localStorage.removeItem(DRAFT_KEY)
      setContent('')
      
      if (shouldNavigate) {
        navigate(`/idea/${idea.id}`)
      } else {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCaptureAndStart = () => createIdea(true)
  const handleJustCapture = () => createIdea(false)

  return (
    <section style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>捕获</h1>
      
      {/* Type Selector */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {(Object.keys(TYPE_CONFIG) as IdeaType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            style={{
              padding: '8px 16px',
              borderRadius: 4,
              border: type === t ? '2px solid #4F46E5' : '1px solid #ccc',
              background: type === t ? '#EEF2FF' : 'white',
              cursor: 'pointer'
            }}
          >
            {TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>
      
      {/* Helper Text */}
      <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
        {TYPE_CONFIG[type].helper}
      </p>
      
      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={TYPE_CONFIG[type].placeholder}
        rows={6}
        style={{
          width: '100%',
          padding: 12,
          fontSize: 16,
          borderRadius: 4,
          border: '1px solid #ccc',
          marginBottom: 16,
          resize: 'vertical'
        }}
      />
      
      {/* Success Toast */}
      {showSuccess && (
        <div style={{
          padding: 12,
          background: '#D1FAE5',
          borderRadius: 4,
          marginBottom: 16,
          color: '#065F46'
        }}>
          想法已保存！
        </div>
      )}
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={handleCaptureAndStart}
          disabled={!content.trim() || isSubmitting}
          style={{
            padding: '12px 24px',
            background: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: content.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
            opacity: content.trim() && !isSubmitting ? 1 : 0.5
          }}
        >
          {isSubmitting ? '保存中...' : '记录并开始孵化'}
        </button>
        
        <button
          type="button"
          onClick={handleJustCapture}
          disabled={!content.trim() || isSubmitting}
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#4F46E5',
            border: '1px solid #4F46E5',
            borderRadius: 4,
            cursor: content.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
            opacity: content.trim() && !isSubmitting ? 1 : 0.5
          }}
        >
          仅记录
        </button>
      </div>
    </section>
  )
}
