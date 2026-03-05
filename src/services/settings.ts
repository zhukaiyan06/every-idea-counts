export type AiProvider = 'glm' | 'qwen'
export type AiStyle = 'sharp' | 'gentle'
export type AiVerbosity = 'short' | 'detailed'

export interface AppSettings {
  provider: AiProvider
  style: AiStyle
  verbosity: AiVerbosity
}

const SETTINGS_KEY = 'every-idea-counts-settings'

const DEFAULT_SETTINGS: AppSettings = {
  provider: 'glm',
  style: 'sharp',
  verbosity: 'short',
}

export function loadSettings(): AppSettings {
  const raw = localStorage.getItem(SETTINGS_KEY)
  if (!raw) return DEFAULT_SETTINGS

  try {
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return {
      provider: parsed.provider === 'qwen' ? 'qwen' : 'glm',
      style: parsed.style === 'gentle' ? 'gentle' : 'sharp',
      verbosity: parsed.verbosity === 'detailed' ? 'detailed' : 'short',
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getDefaultSettings(): AppSettings {
  return DEFAULT_SETTINGS
}
