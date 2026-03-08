import { useMemo, useState } from 'react'

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { supabase } from '../../lib/supabase'
import ContinueDiggingDialog from '../capture/ContinueDiggingDialog'
import { useTheme } from '../../design'

type IdeaType = "product" | "creative" | "research"
type CaptureMode = "quick" | "deep"

type DeepAnswers = {
  q1: string
  q2: string
  q3: string
}

interface NoteIdea {
  id: string
  idea_type: IdeaType
  raw_input: string
  capture_mode?: CaptureMode
  deep_answers?: DeepAnswers
  final_note?: string | null
}

interface NotePanelProps {
  idea: NoteIdea
  onPatchIdea: (patch: { final_note?: string; status?: 'draft' | 'incubating' | 'completed' | 'archived'; updated_at?: string }) => Promise<void>
}

function downloadText(filename: string, content: string, mime = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function sanitizeMarkdownToHtml(markdown: string, isDark: boolean) {
  const strippedScripts = markdown.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
  const escaped = strippedScripts
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const lines = escaped.split('\n')
  const htmlLines = lines.map((line) => {
    if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`
    if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`
    if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`
    if (line.startsWith('- [ ] ')) return `<p>☐ ${line.slice(6)}</p>`
    if (line.startsWith('- [x] ')) return `<p>☑ ${line.slice(6)}</p>`
    if (line.startsWith('- ')) return `<p>• ${line.slice(2)}</p>`
    if (line.trim() === '---') return '<hr />'
    return `<p>${line}</p>`
  })

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Idea Note</title>
  <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'DM Sans', -apple-system, sans-serif; 
      max-width: 720px; 
      margin: 0 auto; 
      padding: 48px; 
      line-height: 1.7; 
      color: ${isDark ? '#FAFAFA' : '#18181B'};
      background: ${isDark ? '#0A0A0A' : '#FAFAFA'};
    }
    h1, h2, h3 { font-family: 'Crimson Pro', Georgia, serif; margin-top: 2em; font-weight: 600; letter-spacing: -0.02em; }
    h1 { font-size: 1.75rem; border-bottom: 1px solid ${isDark ? '#27272A' : '#E4E4E7'}; padding-bottom: 0.5em; }
    h2 { font-size: 1.35rem; }
    h3 { font-size: 1.1rem; }
    p { margin: 0 0 1em; }
    hr { border: none; border-top: 2px solid ${isDark ? '#27272A' : '#E4E4E7'}; margin: 2em 0; }
    code { 
      font-family: 'SF Mono', 'Fira Code', monospace;
      background: ${isDark ? '#27272A' : '#F4F4F5'}; 
      padding: 2px 8px; 
      border-radius: 4px; 
      font-size: 0.875em;
    }
    pre {
      background: ${isDark ? '#18181B' : '#F4F4F5'};
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code {
      background: transparent;
      padding: 0;
    }
    blockquote {
      border-left: 3px solid ${isDark ? '#2DD4BF' : '#0D9488'};
      margin: 1.5em 0;
      padding: 0.5em 0 0.5em 1.25em;
      color: ${isDark ? '#A1A1AA' : '#52525B'};
      background: ${isDark ? 'rgba(45, 212, 191, 0.05)' : 'rgba(13, 148, 136, 0.05)'};
      border-radius: 0 8px 8px 0;
    }
    ul, ol { padding-left: 1.5em; }
    li { margin: 0.25em 0; }
    a { color: ${isDark ? '#2DD4BF' : '#0D9488'}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>${htmlLines.join('')}</body>
</html>`
}

// Loading indicator component
function GeneratingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: 'currentColor',
              animation: `pulse-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>
      <span>生成中...</span>
    </div>
  )
}

export default function NotePanel({ idea, onPatchIdea }: NotePanelProps) {
  const { theme } = useTheme()
  const isDark = theme.isDark

  const [note, setNote] = useState(idea.final_note || '')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showDiggingDialog, setShowDiggingDialog] = useState(false)

  const safePreviewSource = useMemo(() => note, [note])

  const handleSave = async () => {
    setSaving(true)
    await onPatchIdea({
      final_note: note,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
  }

  const handleGenerateNote = async () => {
    setGenerating(true)

    const { data, error } = await supabase.functions.invoke("ai_extract_note", {
      body: {
        idea_id: idea.id,
        idea_type: idea.idea_type,
        raw_input: idea.raw_input,
        capture_mode: idea.capture_mode || "quick",
        deep_answers: idea.deep_answers,
        timestamp: new Date().toISOString()
      }
    })

    const generated = !error && data?.markdown
      ? String(data.markdown)
      : '# 生成失败\n\n## 📋 行动项\n- [ ] 稍后重试\n- [ ] 检查 AI 服务配置'

    const marker = `---\n**AI 生成** · ${new Date().toLocaleString('zh-CN')}\n\n`
    const appended = note.trim() ? `${note}\n\n${marker}${generated}` : `${marker}${generated}`

    setNote(appended)
    await onPatchIdea({
      final_note: appended,
      status: 'completed',
      updated_at: new Date().toISOString(),
    })

    setGenerating(false)
  }

  const handleExportMarkdown = () => {
    downloadText(`idea-${idea.id}.md`, note || '')
  }

  const handleExportHtml = () => {
    const html = sanitizeMarkdownToHtml(note || '', isDark)
    downloadText(`idea-${idea.id}.html`, html, 'text/html;charset=utf-8')
  }

  const handleUpdateNoteFromDigging = async (newContent: string) => {
    setNote(newContent)
    await onPatchIdea({
      final_note: newContent,
      updated_at: new Date().toISOString()
    })
  }

  return (
    <div>
      {/* Action Buttons */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap"
        }}
      >
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || generating}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: 10,
            color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: saving || generating ? 'not-allowed' : 'pointer',
            opacity: saving || generating ? 0.5 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          {saving ? '保存中...' : '保存'}
        </button>

        <button
          type="button"
          onClick={handleGenerateNote}
          disabled={saving || generating}
          style={{
            padding: '10px 20px',
            background: theme.colors.accent.primary,
            border: 'none',
            borderRadius: 10,
            color: '#FFFFFF',
            fontSize: '0.9375rem',
            fontWeight: 600,
            cursor: saving || generating ? 'not-allowed' : 'pointer',
            opacity: saving || generating ? 0.7 : 1,
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: isDark 
              ? '0 2px 12px rgba(45, 212, 191, 0.25)' 
              : '0 2px 12px rgba(13, 148, 136, 0.2)'
          }}
        >
          {generating ? <GeneratingIndicator /> : (
            <>
              <span>✦</span>
              生成笔记
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setShowDiggingDialog(true)}
          disabled={saving || generating}
          style={{
            padding: '10px 16px',
            background: isDark ? theme.colors.accent.secondaryLight : '#EEF2FF',
            border: `1px solid ${isDark ? '#312E81' : '#C7D2FE'}`,
            borderRadius: 10,
            color: isDark ? '#A5B4FC' : '#4F46E5',
            fontSize: '0.9375rem',
            fontWeight: 500,
            cursor: saving || generating ? 'not-allowed' : 'pointer',
            opacity: saving || generating ? 0.5 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          继续深入挖掘
        </button>

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={handleExportMarkdown}
          disabled={generating}
          style={{
            padding: '10px 14px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: 10,
            color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.5 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          .md
        </button>

        <button
          type="button"
          onClick={handleExportHtml}
          disabled={generating}
          style={{
            padding: '10px 14px',
            background: 'transparent',
            border: `1px solid ${theme.colors.border.default}`,
            borderRadius: 10,
            color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
            fontSize: '0.875rem',
            fontWeight: 500,
            cursor: generating ? 'not-allowed' : 'pointer',
            opacity: generating ? 0.5 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          .html
        </button>
      </div>

      {/* Note Preview */}
      <div
        style={{
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: 16,
          padding: '28px 24px',
          minHeight: 320,
          background: isDark ? theme.colors.bg.tertiary : theme.colors.bg.secondary,
          boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.03)' : 'inset 0 1px 0 rgba(255,255,255,0.5)'
        }}
      >
        <style>{`
          @keyframes pulse-dot {
            0%, 80%, 100% { transform: scale(1); opacity: 0.4; }
            40% { transform: scale(1.4); opacity: 1; }
          }
          
          .markdown-content {
            font-size: 0.9375rem;
            line-height: 1.75;
            color: ${isDark ? '#D4D4D8' : '#3F3F46'};
          }
          
          .markdown-content h1 {
            font-family: 'Crimson Pro', 'Noto Serif SC', Georgia, serif;
            font-size: 1.625rem;
            font-weight: 600;
            margin: 0 0 1rem 0;
            color: ${isDark ? '#FAFAFA' : '#18181B'};
            letter-spacing: -0.02em;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid ${isDark ? '#27272A' : '#E4E4E7'};
          }
          
          .markdown-content h2 {
            font-family: 'Crimson Pro', 'Noto Serif SC', Georgia, serif;
            font-size: 1.25rem;
            font-weight: 600;
            margin: 1.75rem 0 0.75rem 0;
            color: ${isDark ? '#FAFAFA' : '#18181B'};
            letter-spacing: -0.015em;
          }
          
          .markdown-content h3 {
            font-family: 'Crimson Pro', 'Noto Serif SC', Georgia, serif;
            font-size: 1.0625rem;
            font-weight: 600;
            margin: 1.25rem 0 0.5rem 0;
            color: ${isDark ? '#FAFAFA' : '#18181B'};
          }
          
          .markdown-content p {
            margin: 0 0 1rem 0;
          }
          
          .markdown-content ul, .markdown-content ol {
            margin: 0 0 1rem 0;
            padding-left: 1.25rem;
          }
          
          .markdown-content li {
            margin: 0.35rem 0;
          }
          
          .markdown-content li::marker {
            color: ${isDark ? '#52525B' : '#A1A1AA'};
          }
          
          .markdown-content hr {
            border: none;
            border-top: 2px solid ${isDark ? '#27272A' : '#E4E4E7'};
            margin: 1.75rem 0;
          }
          
          .markdown-content code {
            font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
            background: ${isDark ? '#27272A' : '#E4E4E7'};
            padding: 2px 7px;
            border-radius: 4px;
            font-size: 0.85em;
            color: ${isDark ? '#FAFAFA' : '#18181B'};
          }
          
          .markdown-content pre {
            background: ${isDark ? '#18181B' : '#F4F4F5'};
            padding: 16px;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1rem 0;
            border: 1px solid ${isDark ? '#27272A' : '#E4E4E7'};
          }
          
          .markdown-content pre code {
            background: transparent;
            padding: 0;
            font-size: 0.875rem;
          }
          
          .markdown-content blockquote {
            border-left: 3px solid ${theme.colors.accent.primary};
            margin: 1.25rem 0;
            padding: 0.5rem 0 0.5rem 1rem;
            color: ${isDark ? '#A1A1AA' : '#52525B'};
            background: ${isDark ? 'rgba(45, 212, 191, 0.05)' : 'rgba(13, 148, 136, 0.05)'};
            border-radius: 0 8px 8px 0;
          }
          
          .markdown-content a {
            color: ${theme.colors.accent.primary};
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.15s ease;
          }
          
          .markdown-content a:hover {
            border-bottom-color: ${theme.colors.accent.primary};
          }
          
          .markdown-content strong {
            font-weight: 600;
            color: ${isDark ? '#FAFAFA' : '#18181B'};
          }
          
          .markdown-content em {
            font-style: italic;
            color: ${isDark ? '#D4D4D8' : '#52525B'};
          }
          
          .markdown-content input[type="checkbox"] {
            margin-right: 0.5rem;
            accent-color: ${theme.colors.accent.primary};
            width: 14px;
            height: 14px;
          }
          
          .markdown-content .contains-task-list {
            list-style: none;
            padding-left: 0;
          }
        `}</style>

        <div className="markdown-content">
          {safePreviewSource ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
            >
              {safePreviewSource}
            </ReactMarkdown>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
              }}
            >
              <div style={{
                fontSize: '2.5rem',
                marginBottom: 16,
                opacity: 0.6
              }}>✦</div>
              <p style={{
                marginBottom: 8,
                fontSize: '1rem',
                fontWeight: 500,
                color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary
              }}>
                暂无笔记内容
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary
              }}>
                点击「生成笔记」让 AI 帮你整理想法
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Continue Digging Dialog */}
      {showDiggingDialog && (
        <ContinueDiggingDialog
          ideaId={idea.id}
          ideaType={idea.idea_type}
          rawInput={idea.raw_input}
          currentNote={note}
          onClose={() => setShowDiggingDialog(false)}
          onUpdateNote={handleUpdateNoteFromDigging}
        />
      )}
    </div>
  )
}