import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { loadIdeasMerged, SYNC_UPDATED_EVENT, archiveIdeaLocalFirst, type IdeaRecord } from '../services/offline'
import { useTheme } from '../design'

type IdeaType = 'product' | 'creative' | 'research'
type IdeaStatus = 'draft' | 'incubating' | 'completed' | 'archived'

type IdeaItem = IdeaRecord & { unsynced?: boolean }

const IDEA_TYPE_CONFIG: Record<IdeaType, { label: string; icon: string; color: string }> = {
  product: { label: '产品', icon: '◈', color: '#6366F1' },
  creative: { label: '创作', icon: '✧', color: '#EC4899' },
  research: { label: '研究', icon: '◇', color: '#0D9488' },
}

const IDEA_STATUS_CONFIG: Record<IdeaStatus, { 
  label: string; 
  bgLight: string; 
  bgDark: string; 
  textLight: string; 
  textDark: string;
}> = {
  draft: { label: '草稿', bgLight: '#F4F4F5', bgDark: '#27272A', textLight: '#52525B', textDark: '#A1A1AA' },
  incubating: { label: '孵化中', bgLight: '#DBEAFE', bgDark: '#1E3A5F', textLight: '#1D4ED8', textDark: '#60A5FA' },
  completed: { label: '已完成', bgLight: '#D1FAE5', bgDark: '#064E3B', textLight: '#065F46', textDark: '#34D399' },
  archived: { label: '已归档', bgLight: '#FEF3C7', bgDark: '#78350F', textLight: '#92400E', textDark: '#FBBF24' },
}

// Calculate how stale an idea is (in days)
function getStaleDays(updatedAt: string): number {
  const now = new Date()
  const date = new Date(updatedAt)
  return Math.floor((now.getTime() - date.getTime()) / 86400000)
}

// Time ago helper
function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  const diffWeeks = Math.floor(diffDays / 7)

  if (diffMins < 1) return "刚刚"
  if (diffMins < 60) return `${diffMins} 分钟前`
  if (diffHours < 24) return `${diffHours} 小时前`
  if (diffDays < 7) return `${diffDays} 天前`
  if (diffWeeks < 4) return `${diffWeeks} 周前`
  return date.toLocaleDateString("zh-CN")
}

export default function WeeklyReviewPage() {
  const navigate = useNavigate()
  const { theme } = useTheme()
  const isDark = theme.isDark

	const [ideas, setIdeas] = useState<IdeaItem[]>([])
	const [loading, setLoading] = useState(true)
	const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())

  // Load ideas on mount
  useEffect(() => {
    const loadIdeas = async () => {
      setLoading(true)
      const merged = await loadIdeasMerged()
      // Filter out archived items for review page
      const active = merged.filter(item => item.status !== 'archived').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
      setIdeas(active)
      setLoading(false)
    }
    loadIdeas()
  }, [])

  // Listen for sync updates
  useEffect(() => {
    const handleSyncUpdate = () => {
      loadIdeasMerged().then(merged => {
        const active = merged.filter(item => item.status !== 'archived').sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime())
        setIdeas(active)
      })
    }
    window.addEventListener(SYNC_UPDATED_EVENT, handleSyncUpdate)
    return () => window.removeEventListener(SYNC_UPDATED_EVENT, handleSyncUpdate)
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
		// Trigger exit animation
		setExitingIds((prev) => new Set([...prev, idea.id]))
		
		// Wait for animation
		await new Promise((resolve) => setTimeout(resolve, 350))
		
		await archiveIdeaLocalFirst(idea)
		setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
		setExitingIds((prev) => {
			const next = new Set(prev)
			next.delete(idea.id)
			return next
		})
	}

  return (
    <section style={{ maxWidth: 880, margin: '0 auto' }}>
      {/* Page Header */}
      <header style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: '1.75rem',
            fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
            fontWeight: 600,
            color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}
        >
          每周回顾
        </h1>
        <p
          style={{
            fontSize: '0.9375rem',
            color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
            lineHeight: 1.6
          }}
        >
          优先处理最容易被遗忘的想法，让每一个想法都算数
        </p>
      </header>

      {/* Summary Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <div style={{
          flex: 1,
          minWidth: 140,
          padding: '16px 20px',
          background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          transition: 'transform 0.2s ease',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isDark ? `${theme.colors.accent.primary}20` : `${theme.colors.accent.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>✦</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary, marginBottom: 2 }}>
              本周新增
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: isDark ? theme.colors.text.primary : theme.colors.text.primary }}>
              {summary.newThisWeek}
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          minWidth: 140,
          padding: '16px 20px',
          background: isDark ? '#1E3A5F' : '#DBEAFE',
          border: `1px solid ${isDark ? '#2563EB' : '#BFDBFE'}`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isDark ? 'rgba(96, 165, 250, 0.2)' : 'rgba(29, 78, 216, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>◐</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: isDark ? '#93C5FD' : '#1D4ED8', marginBottom: 2 }}>
              孵化中
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: isDark ? '#60A5FA' : '#1D4ED8' }}>
              {summary.incubating}
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          minWidth: 140,
          padding: '16px 20px',
          background: isDark ? '#422006' : '#FEF3C7',
          border: `1px solid ${isDark ? '#B45309' : '#FDE68A'}`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(146, 64, 14, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem'
          }}>○</div>
          <div>
            <div style={{ fontSize: '0.75rem', color: isDark ? '#FCD34D' : '#92400E', marginBottom: 2 }}>
              草稿
            </div>
            <div style={{ fontSize: '1.375rem', fontWeight: 700, color: isDark ? '#FBBF24' : '#92400E' }}>
              {summary.draft}
            </div>
          </div>
        </div>
      </div>

      {/* Ideas List */}
      {loading ? (
        <div style={{ padding: 64, textAlign: 'center', color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary }}>
          <div style={{ 
            display: 'inline-block',
            width: 24,
            height: 24,
            border: `2px solid ${theme.colors.border.default}`,
            borderTopColor: theme.colors.accent.primary,
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: 12
          }}/>
          <p>加载中...</p>
        </div>
      ) : ideas.length === 0 ? (
        <div style={{
          padding: 64,
          textAlign: 'center',
          background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: 16
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>✨</div>
          <p style={{ color: isDark ? theme.colors.text.primary : theme.colors.text.primary, marginBottom: 8, fontSize: '1.125rem', fontWeight: 500 }}>
            本周没有待回顾的想法
          </p>
          <p style={{ color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary, fontSize: '0.9375rem' }}>
            所有想法都已处理完成，干得漂亮！
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 14 }}>
          {ideas.map((idea, index) => {
            const typeConfig = IDEA_TYPE_CONFIG[idea.idea_type]
            const statusConfig = IDEA_STATUS_CONFIG[idea.status]
            const staleDays = getStaleDays(idea.updated_at)
            const isStale = staleDays >= 7
            const isMostStale = index === 0 && staleDays >= 3
            
					return (
						<article
							key={idea.id}
							className={exitingIds.has(idea.id) ? 'card-exit' : undefined}
							style={{
								position: 'relative',
								border: `1px solid ${isMostStale ? '#EF4444' : isStale ? '#F59E0B' : theme.colors.border.default}`,
								borderRadius: 16,
								padding: 20,
								background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
								transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
								animation: `fadeInUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.06}s both`,
								cursor: 'pointer',
							}}
							onClick={() => navigate(`/idea/${idea.id}`)}
							onMouseEnter={(e) => {
								e.currentTarget.style.transform = 'translateY(-4px) scale(1.005)'
								e.currentTarget.style.boxShadow = isDark 
									? '0 12px 32px rgba(0,0,0,0.35)'
									: '0 12px 32px rgba(0,0,0,0.1)'
							}}
							onMouseLeave={(e) => {
								e.currentTarget.style.transform = 'translateY(0) scale(1)'
								e.currentTarget.style.boxShadow = 'none'
							}}
						>
                {/* Stale warning indicator */}
                {isMostStale && (
                  <div style={{
                    position: 'absolute',
                    top: -1,
                    left: -1,
                    right: -1,
                    height: 3,
                    background: 'linear-gradient(90deg, #EF4444, #F59E0B)',
                    borderRadius: '16px 16px 0 0'
                  }} />
                )}

                {/* Left accent bar */}
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 20,
                  bottom: 20,
                  width: 3,
                  background: typeConfig.color,
                  borderRadius: '0 2px 2px 0',
                  opacity: 0.8
                }} />

                <div style={{ paddingLeft: 12 }}>
                  {/* Stale badge */}
                  {isMostStale && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      background: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                      borderRadius: 6,
                      marginBottom: 12,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#EF4444'
                    }}>
                      <span>⚠</span>
                      停滞 {staleDays} 天，需要关注
                    </div>
                  )}

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <h3 style={{
                      fontSize: '1.0625rem',
                      fontWeight: 600,
                      color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
                      lineHeight: 1.4,
                      margin: 0,
                      flex: 1
                    }}>
                      {idea.title || '（未命名）'}
                    </h3>
                    
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: isDark ? `${typeConfig.color}20` : `${typeConfig.color}15`,
                        color: typeConfig.color
                      }}>
                        <span>{typeConfig.icon}</span>
                        {typeConfig.label}
                      </span>
                      
                      <span style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        background: isDark ? statusConfig.bgDark : statusConfig.bgLight,
                        color: isDark ? statusConfig.textDark : statusConfig.textLight
                      }}>
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Preview */}
                  <p style={{
                    color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
                    margin: 0,
                    fontSize: '0.9375rem',
                    lineHeight: 1.6,
                    marginBottom: 14,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {idea.raw_input}
                  </p>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <time style={{
                      color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
                      fontSize: '0.8125rem',
                      fontWeight: 500
                    }}>
                      {timeAgo(idea.updated_at)}
                    </time>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => navigate(`/idea/${idea.id}`)}
                        style={{
                          padding: '9px 16px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          borderRadius: 10,
                          background: theme.colors.accent.primary,
                          border: 'none',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        继续孵化
                      </button>
                      <button
                        type="button"
                        onClick={() => archiveIdea(idea)}
                        style={{
                          padding: '9px 16px',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          borderRadius: 10,
                          background: 'transparent',
                          border: `1px solid ${theme.colors.border.default}`,
                          color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        归档
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        button:hover { filter: brightness(1.1); }
        button:active { transform: scale(0.97); }
      `}</style>
    </section>
  )
}