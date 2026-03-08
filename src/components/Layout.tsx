import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { SYNC_FAILURE_EVENT } from '../services/offline'
import { useTheme } from '../design'
import PageTransition from './PageTransition'

export default function Layout() {
  const [showSyncError, setShowSyncError] = useState(false)
  const { theme, toggleMode } = useTheme()
  const isDark = theme.isDark

  useEffect(() => {
    const handleSyncFailure = () => {
      setShowSyncError(true)
      window.setTimeout(() => setShowSyncError(false), 3000)
    }

    window.addEventListener(SYNC_FAILURE_EVENT, handleSyncFailure)
    return () => window.removeEventListener(SYNC_FAILURE_EVENT, handleSyncFailure)
  }, [])

  const navItems = [
    { to: '/capture', label: '捕获', icon: '✦' },
    { to: '/library', label: '想法库', icon: '▣' },
    { to: '/review', label: '回顾', icon: '↻' },
    { to: '/settings', label: '设置', icon: '⚙' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: isDark ? theme.colors.bg.primary : theme.colors.bg.primary,
      }}
    >
      {/* Sync Error Toast */}
      {showSyncError && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: isDark ? theme.colors.semantic.errorBg : theme.colors.semantic.errorBg,
            color: isDark ? '#F87171' : theme.colors.semantic.error,
            padding: '12px 20px',
            borderRadius: 8,
            fontSize: '0.9375rem',
            fontWeight: 500,
            boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.08)',
            zIndex: 1000,
            animation: 'slideIn 0.2s ease',
          }}
        >
          同步失败，稍后重试
        </div>
      )}

      {/* Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: isDark 
            ? 'rgba(10, 10, 10, 0.8)' 
            : 'rgba(250, 250, 250, 0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${theme.colors.border.default}`,
          zIndex: 100,
        }}
      >
        <nav
          style={{
            maxWidth: 1000,
            margin: '0 auto',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
          }}
        >
          {/* Logo */}
          <NavLink
            to="/capture"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              textDecoration: 'none',
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontFamily: '"Crimson Pro", "Noto Serif SC", Georgia, serif',
                fontWeight: 700,
                color: isDark ? theme.colors.accent.primary : theme.colors.accent.primary,
                letterSpacing: '-0.02em',
              }}
            >
              Every Idea Counts
            </span>
          </NavLink>

          {/* Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.9375rem',
                  fontWeight: 500,
                  color: isActive
                    ? isDark ? theme.colors.text.primary : theme.colors.text.primary
                    : isDark ? theme.colors.text.tertiary : theme.colors.text.secondary,
                  background: isActive
                    ? isDark ? theme.colors.bg.tertiary : theme.colors.bg.tertiary
                    : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 150ms ease',
                })}
              >
                <span style={{ fontSize: 14 }}>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleMode}
              aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
              style={{
                marginLeft: 8,
                padding: 8,
                borderRadius: 8,
                background: 'transparent',
                border: 'none',
                color: isDark ? theme.colors.text.secondary : theme.colors.text.secondary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 150ms ease',
              }}
            >
              {isDark ? (
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              ) : (
                <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main
        style={{
          flex: 1,
          padding: '32px 24px',
        }}
      >
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '24px',
          textAlign: 'center',
          color: isDark ? theme.colors.text.tertiary : theme.colors.text.tertiary,
          fontSize: '0.8125rem',
          borderTop: `1px solid ${theme.colors.border.subtle}`,
        }}
      >
        <span style={{ fontFamily: '"Crimson Pro", serif', fontStyle: 'italic' }}>
          每一个想法都值得被记住
        </span>
      </footer>

      {/* Animation Keyframes */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}