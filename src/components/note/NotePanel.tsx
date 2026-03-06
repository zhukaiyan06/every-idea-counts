import { useMemo, useState } from 'react'

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

import { supabase } from '../../lib/supabase'

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

function sanitizeMarkdownToHtml(markdown: string) {
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
    if (line.startsWith('- ')) return `<p>• ${line.slice(2)}</p>`
    if (line.trim() === '---') return '<hr />'
    return `<p>${line}</p>`
  })

  return `<!doctype html><html><head><meta charset="utf-8"><title>Idea Note</title></head><body>${htmlLines.join('')}</body></html>`
}

export default function NotePanel({ idea, onPatchIdea }: NotePanelProps) {
  const [note, setNote] = useState(idea.final_note || '')
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

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

    const marker = `---\nAI draft (${new Date().toLocaleString('zh-CN')})\n`
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
    const html = sanitizeMarkdownToHtml(note || '')
    downloadText(`idea-${idea.id}.html`, html, 'text/html;charset=utf-8')
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={handleSave} disabled={saving || generating}>
          {saving ? "保存中..." : "保存"}
        </button>
        <button type="button" onClick={handleGenerateNote} disabled={saving || generating}>
          {generating ? "生成中..." : "生成笔记"}
        </button>
        <button type="button" onClick={handleExportMarkdown} disabled={generating}>
          导出 Markdown
        </button>
        <button type="button" onClick={handleExportHtml} disabled={generating}>
          导出 HTML
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="在这里编辑笔记（Markdown）"
          rows={14}
          style={{ width: '100%', padding: 10, border: '1px solid #D1D5DB', borderRadius: 6, resize: 'vertical' }}
        />

        <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 10, minHeight: 220, background: '#fff' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {safePreviewSource || '暂无预览内容'}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
