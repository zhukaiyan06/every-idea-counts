import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import {
	SYNC_UPDATED_EVENT,
	archiveIdeaLocalFirst,
	deleteIdeaLocalFirst,
	loadIdeasMerged,
	type IdeaRecord,
	type IdeaStatus,
	type IdeaType,
} from "../services/offline"
import { useTheme } from "../design"

type SortOption = "updated_desc" | "updated_asc" | "created_desc"

type IdeaItem = IdeaRecord & { unsynced?: boolean }

const IDEA_TYPE_CONFIG: Record<IdeaType, { label: string; icon: string; color: string }> = {
	product: { label: "产品", icon: "◈", color: "#6366F1" },
	creative: { label: "创作", icon: "✧", color: "#EC4899" },
	research: { label: "研究", icon: "◇", color: "#0D9488" },
}

const IDEA_STATUS_CONFIG: Record<IdeaStatus, { 
	label: string; 
	bgLight: string; 
	bgDark: string; 
	textLight: string; 
	textDark: string;
	borderLight: string;
	borderDark: string;
}> = {
	draft: { 
		label: "草稿", 
		bgLight: "#F4F4F5", 
		bgDark: "#27272A",
		textLight: "#52525B", 
		textDark: "#A1A1AA",
		borderLight: "#E4E4E7",
		borderDark: "#3F3F46"
	},
	incubating: { 
		label: "孵化中", 
		bgLight: "#DBEAFE", 
		bgDark: "#1E3A5F",
		textLight: "#1D4ED8", 
		textDark: "#60A5FA",
		borderLight: "#BFDBFE",
		borderDark: "#2563EB"
	},
	completed: { 
		label: "已完成", 
		bgLight: "#D1FAE5", 
		bgDark: "#064E3B",
		textLight: "#065F46", 
		textDark: "#34D399",
		borderLight: "#A7F3D0",
		borderDark: "#059669"
	},
	archived: { 
		label: "已归档", 
		bgLight: "#FEF3C7", 
		bgDark: "#78350F",
		textLight: "#92400E", 
		textDark: "#FBBF24",
		borderLight: "#FDE68A",
		borderDark: "#B45309"
	},
}

function compareIdeas(a: IdeaItem, b: IdeaItem, sort: SortOption) {
	if (sort === "updated_desc") {
		return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
	}
	if (sort === "updated_asc") {
		return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
	}
	return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
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

export default function LibraryPage() {
	const navigate = useNavigate()
	const { theme } = useTheme()
	const isDark = theme.isDark

	const [ideas, setIdeas] = useState<IdeaItem[]>([])
	const [loading, setLoading] = useState(true)
	const [search, setSearch] = useState("")
	const [statusFilter, setStatusFilter] = useState<"all" | IdeaStatus>("all")
	const [typeFilter, setTypeFilter] = useState<"all" | IdeaType>("all")
	const [sortBy, setSortBy] = useState<SortOption>("updated_desc")
	const [showArchived, setShowArchived] = useState(false)
	const [exitingIds, setExitingIds] = useState<Set<string>>(new Set())
	const loadIdeas = useCallback(async () => {
		setLoading(true)
		const merged = await loadIdeasMerged()
		setIdeas(merged)
		setLoading(false)
	}, [])

	useEffect(() => {
		loadIdeas()
	}, [loadIdeas])

	useEffect(() => {
		const handleSyncUpdate = () => {
			loadIdeas()
		}

		window.addEventListener(SYNC_UPDATED_EVENT, handleSyncUpdate)
		return () =>
			window.removeEventListener(SYNC_UPDATED_EVENT, handleSyncUpdate)
	}, [loadIdeas])

	const filteredIdeas = useMemo(() => {
		let result = ideas

		if (!showArchived) {
			result = result.filter((item) => item.status !== "archived")
		}

		if (statusFilter !== "all") {
			result = result.filter((item) => item.status === statusFilter)
		}

		if (typeFilter !== "all") {
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
		// Trigger exit animation
		setExitingIds((prev) => new Set([...prev, idea.id]))
		
		// Wait for animation to complete
		await new Promise((resolve) => setTimeout(resolve, 350))
		
		await archiveIdeaLocalFirst(idea)
		setIdeas((prev) =>
			prev.map((item) =>
				item.id === idea.id
					? {
							...item,
							status: "archived",
							updated_at: new Date().toISOString(),
						}
						: item
			)
		)
		setExitingIds((prev) => {
			const next = new Set(prev)
			next.delete(idea.id)
			return next
		})
	}

	const handleDelete = async (idea: IdeaItem) => {
		// Trigger exit animation
		setExitingIds((prev) => new Set([...prev, idea.id]))
		
		// Wait for animation
		await new Promise((resolve) => setTimeout(resolve, 350))
		
		await deleteIdeaLocalFirst(idea)
		setIdeas((prev) => prev.filter((item) => item.id !== idea.id))
		setExitingIds((prev) => {
			const next = new Set(prev)
			next.delete(idea.id)
			return next
		})
	}

	const inputStyle = {
		padding: '12px 16px',
		border: `1px solid ${theme.colors.border.default}`,
		borderRadius: 12,
		background: isDark ? theme.colors.bg.tertiary : 'transparent',
		color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
		fontSize: '0.9375rem',
		outline: 'none',
		transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
		cursor: 'pointer'
	}

	return (
		<section style={{ maxWidth: 880, margin: "0 auto" }}>
			{/* Page Header */}
			<header style={{ marginBottom: 32 }}>
				<div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 8 }}>
					<h1
						style={{
							fontSize: '1.75rem',
							fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
							fontWeight: 600,
							color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
							letterSpacing: '-0.02em'
						}}
					>
						想法库
					</h1>
					<span style={{
						fontSize: '0.875rem',
						color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
						fontWeight: 500
					}}>
						{filteredIdeas.length} 个想法
					</span>
				</div>
				<p
					style={{
						fontSize: '0.9375rem',
						color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
					}}
				>
					所有被捕捉的想法，每一个都值得被记住
				</p>
			</header>

			{/* Filters */}
			<div
				style={{
					display: "grid",
					gap: 14,
					marginBottom: 28,
					padding: 18,
					background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
					border: `1px solid ${theme.colors.border.default}`,
					borderRadius: 16,
					boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 1px 3px rgba(0,0,0,0.04)'
				}}
			>
				<div style={{ position: 'relative' }}>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="搜索想法、笔记..."
						style={{ ...inputStyle, width: '100%', paddingLeft: 40 }}
					/>
					<span style={{
						position: 'absolute',
						left: 14,
						top: '50%',
						transform: 'translateY(-50%)',
						color: isDark ? theme.colors.text.tertiary : '#A1A1AA',
						fontSize: '1rem'
					}}>⌕</span>
				</div>

				<div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: 'center' }}>
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as "all" | IdeaStatus)}
						style={inputStyle}
					>
						<option value="all">全部状态</option>
						<option value="draft">草稿</option>
						<option value="incubating">孵化中</option>
						<option value="completed">已完成</option>
						<option value="archived">已归档</option>
					</select>

					<select
						value={typeFilter}
						onChange={(e) => setTypeFilter(e.target.value as "all" | IdeaType)}
						style={inputStyle}
					>
						<option value="all">全部类型</option>
						<option value="product">产品</option>
						<option value="creative">创作</option>
						<option value="research">研究</option>
					</select>

					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value as SortOption)}
						style={inputStyle}
					>
						<option value="updated_desc">最近更新</option>
						<option value="updated_asc">最久未更新</option>
						<option value="created_desc">最近创建</option>
					</select>

					<label
						style={{
							display: "flex",
							gap: 8,
							alignItems: "center",
							cursor: 'pointer',
							fontSize: '0.875rem',
							color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
							padding: '8px 12px',
							borderRadius: 8,
							background: showArchived 
								? (isDark ? theme.colors.bg.tertiary : '#F4F4F5')
								: 'transparent',
							transition: 'all 0.15s ease'
						}}
					>
						<input
							type="checkbox"
							checked={showArchived}
							onChange={(e) => setShowArchived(e.target.checked)}
							style={{ width: 16, height: 16, accentColor: theme.colors.accent.primary }}
						/>
						已归档
					</label>
				</div>
			</div>

			{/* Ideas List */}
			{loading ? (
				<div
					style={{
						padding: 64,
						textAlign: 'center',
						color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary
					}}
				>
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
			) : filteredIdeas.length === 0 ? (
				<div
					style={{
						padding: 64,
						textAlign: 'center',
						color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
						background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
						border: `1px solid ${theme.colors.border.default}`,
						borderRadius: 16
					}}
				>
					<p style={{ fontSize: '1.125rem', marginBottom: 8, color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary }}>
						暂无想法
					</p>
					<p style={{ fontSize: '0.875rem' }}>
						去「捕获」页面创建第一条吧
					</p>
				</div>
			) : (
				<div style={{ display: "grid", gap: 14 }}>
					{filteredIdeas.map((idea, index) => {
						const typeConfig = IDEA_TYPE_CONFIG[idea.idea_type]
						const statusConfig = IDEA_STATUS_CONFIG[idea.status]
						
						return (
							<article
								key={idea.id}
								onClick={() => navigate(`/idea/${idea.id}`)}
								className={exitingIds.has(idea.id) ? 'card-exit' : undefined}
								style={{
									position: 'relative',
									border: `1px solid ${theme.colors.border.default}`,
									borderRadius: 16,
									padding: 20,
									background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
									cursor: 'pointer',
									transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
									animation: `fadeInUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.06}s both`,
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.borderColor = typeConfig.color
									e.currentTarget.style.transform = 'translateY(-4px) scale(1.005)'
									e.currentTarget.style.boxShadow = isDark 
										? `0 12px 32px rgba(0,0,0,0.35), 0 0 0 1px ${typeConfig.color}25` 
										: `0 12px 32px rgba(0,0,0,0.1), 0 0 0 1px ${typeConfig.color}15`
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.borderColor = theme.colors.border.default
									e.currentTarget.style.transform = 'translateY(0) scale(1)'
									e.currentTarget.style.boxShadow = 'none'
								}}
							>
								{/* Type indicator line */}
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
									{/* Header */}
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
										<h3 style={{
											fontSize: '1.0625rem',
											fontWeight: 600,
											color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
											lineHeight: 1.4,
											margin: 0,
											flex: 1
										}}>
											{idea.title || "（未命名）"}
										</h3>
										
										{/* Tags */}
										<div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
											<span style={{
												display: 'flex',
												alignItems: 'center',
												gap: 4,
												padding: '5px 10px',
												borderRadius: 8,
												fontSize: '0.75rem',
												fontWeight: 600,
												background: isDark 
													? `${typeConfig.color}20` 
													: `${typeConfig.color}15`,
												color: typeConfig.color,
												border: `1px solid ${typeConfig.color}30`
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
												color: isDark ? statusConfig.textDark : statusConfig.textLight,
												border: `1px solid ${isDark ? statusConfig.borderDark : statusConfig.borderLight}`
											}}>
												{statusConfig.label}
											</span>
											
											{idea.unsynced && (
												<span style={{
													padding: '5px 10px',
													borderRadius: 8,
													fontSize: '0.75rem',
													fontWeight: 500,
													background: isDark ? '#78350F' : '#FEF3C7',
													color: isDark ? '#FBBF24' : '#B45309',
													border: `1px solid ${isDark ? '#92400E' : '#FDE68A'}`
												}}>
													未同步
												</span>
											)}
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

										<div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
											<button
												type="button"
												onClick={() => navigate(`/idea/${idea.id}`)}
												style={{
													padding: "7px 14px",
													fontSize: '0.8125rem',
													fontWeight: 500,
													borderRadius: 8,
													background: theme.colors.accent.primary,
													border: 'none',
													color: '#FFFFFF',
													cursor: "pointer",
													transition: 'all 0.15s ease'
												}}
											>
												查看
											</button>
											<button
												type="button"
												onClick={() => handleArchive(idea)}
												style={{
													padding: "7px 14px",
													fontSize: '0.8125rem',
													fontWeight: 500,
													borderRadius: 8,
													background: 'transparent',
													border: `1px solid ${theme.colors.border.default}`,
													color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
													cursor: "pointer",
													transition: 'all 0.15s ease'
												}}
											>
												归档
											</button>
											<button
												type="button"
												onClick={() => handleDelete(idea)}
												style={{
													padding: "7px 14px",
													fontSize: '0.8125rem',
													fontWeight: 500,
													borderRadius: 8,
													background: 'transparent',
													border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'}`,
													color: isDark ? '#F87171' : '#EF4444',
													cursor: "pointer",
													transition: 'all 0.15s ease'
												}}
											>
												删除
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
        /* Spring-like entrance with bounce */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideOutRight {
          from {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateX(120%) scale(0.95);
            opacity: 0;
          }
        }
        
        .card-exit {
          animation: slideOutRight 0.35s cubic-bezier(0.4, 0, 1, 1) forwards;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        input::placeholder, select {
          color: ${isDark ? theme.colors.text.tertiary : '#A1A1AA'};
        }
        input:focus, select:focus {
          border-color: ${theme.colors.accent.primary};
          box-shadow: 0 0 0 3px ${isDark ? 'rgba(45, 212, 191, 0.15)' : 'rgba(13, 148, 136, 0.1)'};
        }
        
        button:hover {
          filter: brightness(1.1);
        }
        
        button:active {
          transform: scale(0.97);
        }
        
        select option {
          background: ${isDark ? '#27272A' : '#FFFFFF'};
          color: ${isDark ? '#FAFAFA' : '#18181B'};
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
		</section>
	)
}