import { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// Page transition wrapper with fade-in + zoom effect
export default function PageTransition({
  children,
}: {
  children: React.ReactNode
}) {
  const location = useLocation()
  const [isAnimating, setIsAnimating] = useState(false)
  const prevPathRef = useRef(location.pathname)

  useEffect(() => {
    // Only animate on navigation change
    if (prevPathRef.current !== location.pathname) {
      setIsAnimating(true)
      prevPathRef.current = location.pathname

      // Reset animation state after transition
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

  return (
    <div
      style={{
        opacity: isAnimating ? 0 : 1,
        transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
        transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}

// Staggered content reveal wrapper
export function StaggeredReveal({
  children,
  staggerDelay = 50,
  baseDelay = 100,
}: {
  children: React.ReactNode[]
  staggerDelay?: number
  baseDelay?: number
}) {
  return (
    <>
      {(Array.isArray(children) ? children : [children]).map((child, index) => (
        <div
          key={index}
          style={{
            opacity: 0,
            animation: `staggerReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + index * staggerDelay}ms forwards`,
            willChange: 'opacity, transform',
          }}
        >
          {child}
        </div>
      ))}
      <style>{`
        @keyframes staggerReveal {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

// Animated content block for Markdown rendering
export function AnimatedContent({
  content,
  isDark,
}: {
  content: React.ReactNode
  isDark: boolean
}) {
  return (
    <div
      style={{
        opacity: 0,
        animation: 'contentReveal 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards',
        willChange: 'opacity, transform',
      }}
    >
      {content}
      <style>{`
        @keyframes contentReveal {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}