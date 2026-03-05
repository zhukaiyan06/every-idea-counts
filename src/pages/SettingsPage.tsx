import { useEffect, useState } from 'react'

import {
  getDefaultSettings,
  loadSettings,
  saveSettings,
  type AiProvider,
  type AiStyle,
  type AiVerbosity,
  type AppSettings,
} from '../services/settings'

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(getDefaultSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <section style={{ maxWidth: 760, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>设置</h1>
      <p style={{ color: '#6B7280', marginBottom: 20 }}>调整 AI 供应商和输出风格，设置会自动保存到本地。</p>

      <div style={{ display: 'grid', gap: 16 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span>AI 供应商</span>
          <select
            value={settings.provider}
            onChange={(e) => handleChange('provider', e.target.value as AiProvider)}
          >
            <option value="glm">GLM (Z.ai)</option>
            <option value="qwen">Qwen (DashScope)</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>提问风格</span>
          <select
            value={settings.style}
            onChange={(e) => handleChange('style', e.target.value as AiStyle)}
          >
            <option value="sharp">更犀利</option>
            <option value="gentle">更温和</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>回答长度</span>
          <select
            value={settings.verbosity}
            onChange={(e) => handleChange('verbosity', e.target.value as AiVerbosity)}
          >
            <option value="short">更短</option>
            <option value="detailed">更详细</option>
          </select>
        </label>
      </div>

      {saved ? (
        <p style={{ marginTop: 14, color: '#065F46' }}>设置已保存</p>
      ) : null}
    </section>
  )
}
