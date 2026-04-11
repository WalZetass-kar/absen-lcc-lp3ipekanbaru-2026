'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

const STORAGE_KEY = 'lcc_profile_photo'

interface ProfileContextType {
  /** Base64 Data URL of the profile photo, or null if none set */
  profilePhoto: string | null
  /** Set a new profile photo (pass base64 data URL) */
  setProfilePhoto: (photo: string | null) => void
  /** Remove the current profile photo */
  removeProfilePhoto: () => void
  /** Whether the context has loaded from localStorage */
  isLoaded: boolean
}

const ProfileContext = createContext<ProfileContextType>({
  profilePhoto: null,
  setProfilePhoto: () => {},
  removeProfilePhoto: () => {},
  isLoaded: false,
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profilePhoto, setProfilePhotoState] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setProfilePhotoState(stored)
      }
    } catch {
      // localStorage not available (SSR, private browsing, etc.)
    }
    setIsLoaded(true)
  }, [])

  const setProfilePhoto = useCallback((photo: string | null) => {
    setProfilePhotoState(photo)
    try {
      if (photo) {
        localStorage.setItem(STORAGE_KEY, photo)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore storage errors
    }
  }, [])

  const removeProfilePhoto = useCallback(() => {
    setProfilePhotoState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }, [])

  return (
    <ProfileContext.Provider value={{ profilePhoto, setProfilePhoto, removeProfilePhoto, isLoaded }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
