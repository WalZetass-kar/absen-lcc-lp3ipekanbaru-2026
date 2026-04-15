'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SkeletonShimmer } from '@/components/ui/skeleton'
import { Bell, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllAnnouncementsWithReadStatus, markAnnouncementAsRead } from '@/lib/student-actions'

interface AnnouncementWithRead {
  id: string
  judul: string
  isi: string
  published_at: string
  is_read: boolean
  read_at: string | null
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<AnnouncementWithRead[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadAnnouncements() {
      setLoading(true)
      try {
        const result = await getAllAnnouncementsWithReadStatus(page, 10)

        if (cancelled) {
          return
        }

        setAnnouncements(result.announcements as AnnouncementWithRead[])
        setTotalPages(result.totalPages)
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading announcements:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadAnnouncements()

    return () => {
      cancelled = true
    }
  }, [page])

  async function handleMarkAsRead(announcementId: string) {
    try {
      await markAnnouncementAsRead(announcementId)
      setAnnouncements(prev =>
        prev.map(a => a.id === announcementId ? { ...a, is_read: true, read_at: new Date().toISOString() } : a)
      )
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pengumuman</h1>
        <p className="text-muted-foreground mt-1">Semua pengumuman dan informasi LCC</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <SkeletonShimmer className="h-6 w-3/4" />
                <SkeletonShimmer className="mt-2 h-4 w-1/4" />
              </CardHeader>
              <CardContent>
                <SkeletonShimmer className="mb-2 h-4 w-full" />
                <SkeletonShimmer className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Belum ada pengumuman</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className={announcement.is_read ? 'opacity-75' : 'border-primary/50'}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {announcement.judul}
                        {!announcement.is_read && (
                          <Badge variant="default" className="text-xs">Baru</Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        {new Date(announcement.published_at).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                    {announcement.is_read && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{announcement.isi}</p>
                  {!announcement.is_read && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => handleMarkAsRead(announcement.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Tandai Sudah Dibaca
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
