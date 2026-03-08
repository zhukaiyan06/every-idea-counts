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
import { useTheme } from '../design'

export default function SettingsPage() {
  const { theme, mode, setMode } = useTheme()
  const isDark = theme.isDark

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
    setTimeout(() => setSaved(false), 1500)
  }

  const inputStyle = {
    width: '100%',
    padding: '14px 16px',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: 10,
    background: isDark ? theme.colors.bg.tertiary : 'transparent',
    color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
    fontSize: '0.9375rem',
    outline: 'none',
    transition: 'border-color 150ms ease',
    cursor: 'pointer'
  }

  return (
    <section style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 40 }}>
        <h1
          style={{
            fontSize: '2rem',
            fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
            fontWeight: 600,
            color: isDark ? theme.colors.text.primary : theme.colors.text.primary,
            marginBottom: 8,
            letterSpacing: '-0.02em'
          }}
        >
          设置
        </h1>
        <p
          style={{
            fontSize: '1rem',
            color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
            lineHeight: 1.6
          }}
        >
          调整应用偏好，设置会自动保存到本地
        </p>
      </div>

      {/* Settings Card */}
      <div
        style={{
          background: isDark ? theme.colors.bg.secondary : theme.colors.bg.secondary,
          border: `1px solid ${theme.colors.border.default}`,
          borderRadius: 16,
          padding: 28,
          marginBottom: 24
        }}
      >
        {/* Theme Setting */}
        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 10,
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: isDark ? theme.colors.text.primary : theme.colors.text.primary
            }}
          >
            外观主题
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setMode('light')}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                border: mode === 'light'
                  ? `2px solid ${theme.colors.accent.primary}`
                  : `1px solid ${theme.colors.border.default}`,
                background: mode === 'light'
                  ? (isDark ? theme.colors.accent.primaryLight : theme.colors.accent.primaryLight)
                  : (isDark ? theme.colors.bg.tertiary : 'transparent'),
                color: mode === 'light'
                  ? theme.colors.accent.primary
                  : (isDark ? theme.colors.text.secondary : theme.colors.text.secondary),
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9375rem',
                transition: 'all 150ms ease'
              }}
            >
              ☀ 浅色
            </button>
            <button
              type="button"
              onClick={() => setMode('dark')}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 10,
                border: mode === 'dark'
                  ? `2px solid ${theme.colors.accent.primary}`
                  : `1px solid ${theme.colors.border.default}`,
                background: mode === 'dark'
                  ? (isDark ? theme.colors.accent.primaryLight : theme.colors.accent.primaryLight)
                  : (isDark ? theme.colors.bg.tertiary : 'transparent'),
                color: mode === 'dark'
                  ? theme.colors.accent.primary
                  : (isDark ? theme.colors.text.secondary : theme.colors.text.secondary),
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.9375rem',
                transition: 'all 150ms ease'
              }}
            >
              ◐ 深色
            </button>
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: theme.colors.border.subtle,
            marginBottom: 28
          }}
        />

        {/* AI Provider */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 10,
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: isDark ? theme.colors.text.primary : theme.colors.text.primary
            }}
          >
            AI 供应商
          </label>
          <select
            value={settings.provider}
            onChange={(e) => handleChange('provider', e.target.value as AiProvider)}
            style={inputStyle}
          >
            <option value="glm">智谱AI (GLM)</option>
            <option value="qwen">通义千问 (Qwen)</option>
          </select>
          <p
            style={{
              marginTop: 8,
              fontSize: '0.8125rem',
              color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary
            }}
          >
            选择生成笔记使用的 AI 服务
          </p>
        </div>

        {/* AI Style */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 10,
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: isDark ? theme.colors.text.primary : theme.colors.text.primary
            }}
          >
            提问风格
          </label>
          <select
            value={settings.style}
            onChange={(e) => handleChange('style', e.target.value as AiStyle)}
            style={inputStyle}
          >
            <option value="sharp">更犀利 - 直击要点，快速迭代</option>
            <option value="gentle">更温和 - 循循善诱，逐步深化</option>
          </select>
        </div>

        {/* AI Verbosity */}
        <div>
          <label
            style={{
              display: 'block',
              marginBottom: 10,
              fontWeight: 500,
              fontSize: '0.9375rem',
              color: isDark ? theme.colors.text.primary : theme.colors.text.primary
            }}
          >
            回答长度
          </label>
          <select
            value={settings.verbosity}
            onChange={(e) => handleChange('verbosity', e.target.value as AiVerbosity)}
            style={inputStyle}
          >
            <option value="short">更短 - 精炼简洁，快速阅读</option>
            <option value="detailed">更详细 - 内容丰富，深入分析</option>
          </select>
        </div>
      </div>

      {/* Save Indicator */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          padding: '12px 20px',
          background: isDark ? theme.colors.semantic.successBg : theme.colors.semantic.successBg,
          color: isDark ? '#34D399' : theme.colors.semantic.success,
          borderRadius: 10,
          fontSize: '0.9375rem',
          fontWeight: 500,
          boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
          opacity: saved ? 1 : 0,
          transform: saved ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 200ms ease',
          pointerEvents: 'none'
        }}
      >
        ✓ 设置已保存
      </div>

      <style>{`
        select option {
          background: ${isDark ? '#27272A' : '#FFFFFF'};
          color: ${isDark ? '#FAFAFA' : '#18181B'};
        }
        select:focus {
          border-color: ${theme.colors.accent.primary};
        }
      `}</style>
    </section>
  )
}