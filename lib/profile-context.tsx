'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

interface ProfileContextType {
  /** URL of the profile photo, or null if none set */
  profilePhoto: string | null
  /** Upload a new profile photo file to the server */
  uploadProfilePhoto: (file: File) => Promise<{ success: boolean; error?: string }>
  /** Remove the current profile photo from the server */
  removeProfilePhoto: () => Promise<void>
  /** Whether the context has loaded the photo from the server */
  isLoaded: boolean
  /** Whether an upload/delete operation is in progress */
  isUploading: boolean
}

const ProfileContext = createContext<ProfileContextType>({
  profilePhoto: null,
  uploadProfilePhoto: async () => ({ success: false }),
  removeProfilePhoto: async () => {},
  isLoaded: false,
  isUploading: false,
})

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  // Load photo URL from server on mount
  useEffect(() => {
    async function fetchPhoto() {
      try {
        const res = await fetch('/api/profile-photo')
        if (res.ok) {
          const data = await res.json()
          if (data.url) {
            setProfilePhoto(data.url)
          }
        }
      } catch {
        // Silently fail — no photo
      }
      setIsLoaded(true)
    }

    fetchPhoto()
  }, [])

  const uploadProfilePhoto = useCallback(async (file: File): Promise<{ success: boolean; error?: string }> => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/profile-photo', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal mengunggah foto' }
      }

      setProfilePhoto(data.url)
      return { success: true }
    } catch {
      return { success: false, error: 'Terjadi kesalahan saat mengunggah foto' }
    } finally {
      setIsUploading(false)
    }
  }, [])

  const removeProfilePhoto = useCallback(async () => {
    setIsUploading(true)
    try {
      await fetch('/api/profile-photo', { method: 'DELETE' })
      setProfilePhoto(null)
    } catch {
      // Ignore
    } finally {
      setIsUploading(false)
    }
  }, [])

  return (
    <ProfileContext.Provider value={{ profilePhoto, uploadProfilePhoto, removeProfilePhoto, isLoaded, isUploading }}>
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
