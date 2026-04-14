'use client'

import { ReactNode } from 'react'
import { useDelayedLoading } from '@/lib/hooks/use-delayed-loading'
import { FadeIn } from './fade-in'

interface LoadingWrapperProps {
  isLoading: boolean
  skeleton: ReactNode
  children: ReactNode
  delay?: number
  fadeInDuration?: number
}

/**
 * Wrapper component untuk menangani loading state dengan skeleton
 * Otomatis menampilkan skeleton saat loading dan fade-in saat selesai
 * 
 * @example
 * <LoadingWrapper
 *   isLoading={loading}
 *   skeleton={<TabelAbsensiSkeleton />}
 * >
 *   <Table data={data} />
 * </LoadingWrapper>
 */
export function LoadingWrapper({
  isLoading,
  skeleton,
  children,
  delay = 300,
  fadeInDuration = 300,
}: LoadingWrapperProps) {
  const showSkeleton = useDelayedLoading(isLoading, delay)

  if (showSkeleton) {
    return <>{skeleton}</>
  }

  return (
    <FadeIn duration={fadeInDuration}>
      {children}
    </FadeIn>
  )
}
