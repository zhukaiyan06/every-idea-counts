/**
 * Theme Provider - 极简生产力风格
 * Provides theme context and dark/light mode switching
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { colors, type ThemeMode, type Theme } from './theme'

// ============================================
// Theme Context
// ============================================

interface ThemeContextValue {
  theme: Theme
  mode: ThemeMode
  toggleMode: () => void
  setMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

// ============================================
// Theme Provider
// ============================================

const STORAGE_KEY = 'every-idea-counts-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    // Check localStorage first
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const body = document.body
    
    if (mode === 'dark') {
      body.classList.add('dark')
      root.style.colorScheme = 'dark'
    } else {
      body.classList.remove('dark')
      root.style.colorScheme = 'light'
    }
    
    localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const stored = localStorage.getItem(STORAGE_KEY)
      // Only auto-switch if user hasn't explicitly set a preference
      if (!stored) {
        setMode(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleMode = () => {
    setMode(prev => prev === 'light' ? 'dark' : 'light')
  }

  const theme: Theme = {
    mode,
    colors: mode === 'dark' ? colors.dark : colors.light,
    isDark: mode === 'dark',
  }

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ============================================
// useTheme Hook
// ============================================

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

// ============================================
// Styled Helper
// ============================================

/**
 * Helper to create theme-aware inline styles
 * Usage: const styles = useStyled(theme => ({ color: theme.colors.text.primary }))
 */
export function useStyled<T extends Record<string, any>>(
  styleFn: (theme: Theme) => T
): T {
  const { theme } = useTheme()
  return styleFn(theme)
}