import { useState, useEffect, useRef } from 'react'

// Animated card with spring-like entrance, hover effects, and exit animations
interface AnimatedCardProps {
  children: React.ReactNode
  index: number
  isDark: boolean
  accentColor?: string
  onHover?: (isHovered: boolean) => void
  isExiting?: boolean
  exitDirection?: 'right' | 'left' | 'fade'
  onClick?: () => void
  className?: string
}

export function AnimatedCard({
  children,
  index,
  isDark,
  accentColor,
  onHover,
  isExiting = false,
  exitDirection = 'right',
  onClick,
}: AnimatedCardProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Staggered entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 60)
    return () => clearTimeout(timer)
  }, [index])

  const handleMouseEnter = () => {
    setIsHovered(true)
    onHover?.(true)
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    onHover?.(false)
  }

  // Calculate animation states
  const getTransform = () => {
    if (isExiting) {
      switch (exitDirection) {
        case 'right':
          return 'translateX(120%) scale(0.95)'
        case 'left':
          return 'translateX(-120%) scale(0.95)'
        case 'fade':
          return 'scale(0.95)'
        default:
          return 'translateX(120%) scale(0.95)'
      }
    }
    if (!isVisible) {
      return 'translateY(20px) scale(0.97)'
    }
    if (isHovered) {
      return 'translateY(-4px) scale(1.01)'
    }
    return 'translateY(0) scale(1)'
  }

  const getOpacity = () => {
    if (isExiting) return 0
    if (!isVisible) return 0
    return 1
  }

  const getBoxShadow = () => {
    if (isExiting) return 'none'
    if (isHovered) {
      return isDark
        ? `0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px ${accentColor || '#2DD4BF'}30`
        : `0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px ${accentColor || '#0D9488'}20`
    }
    return isDark
      ? '0 2px 8px rgba(0,0,0,0.2)'
      : '0 2px 8px rgba(0,0,0,0.04)'
  }

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        transform: getTransform(),
        opacity: getOpacity(),
        boxShadow: getBoxShadow(),
        transition: isExiting
          ? 'transform 0.35s cubic-bezier(0.4, 0, 1, 1), opacity 0.35s ease'
          : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, box-shadow 0.25s ease, border-color 0.25s ease',
        cursor: onClick ? 'pointer' : 'default',
        willChange: 'transform, opacity, box-shadow',
      }}
    >
      {children}
    </div>
  )
}

// Staggered list container with automatic entrance animations
interface StaggeredListProps {
  children: React.ReactNode
  staggerDelay?: number
}

export function StaggeredList({ children, staggerDelay = 50 }: StaggeredListProps) {
  return (
    <div style={{ display: 'grid', gap: 14 }}>
      {children}
    </div>
  )
}

// Hook for managing exit animations
export function useExitAnimation(
  onExitComplete: () => void,
  duration = 350
) {
  const [exitingId, setExitingId] = useState<string | null>(null)

  const triggerExit = (id: string) => {
    setExitingId(id)
    setTimeout(() => {
      onExitComplete()
      setExitingId(null)
    }, duration)
  }

  return { exitingId, triggerExit }
}