'use client'

import { ReactNode, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
}

/**
 * Komponen untuk animasi fade-in saat konten muncul
 * Digunakan setelah loading selesai untuk transisi yang smooth
 */
export function FadeIn({ 
  children, 
  className, 
  delay = 0, 
  duration = 300 
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        'transition-opacity',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}
