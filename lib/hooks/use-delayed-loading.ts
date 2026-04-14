'use client'

import { useState, useEffect } from 'react'

/**
 * Hook untuk menampilkan loading state dengan delay
 * Mencegah flash/flicker pada loading yang terlalu cepat
 * 
 * @param isLoading - State loading aktual
 * @param delay - Delay dalam ms sebelum menampilkan loading (default: 300ms)
 * @returns boolean - Apakah harus menampilkan loading UI
 */
export function useDelayedLoading(isLoading: boolean, delay: number = 300) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (isLoading) {
      // Set timeout untuk menampilkan loading setelah delay
      const timer = setTimeout(() => {
        setShowLoading(true)
      }, delay)

      return () => clearTimeout(timer)
    } else {
      // Langsung hide loading ketika selesai
      setShowLoading(false)
    }
  }, [isLoading, delay])

  return showLoading
}
