'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { SkeletonShimmer } from '@/components/ui/skeleton'
import { MessageSquare, Star, CheckCircle, AlertCircle } from 'lucide-react'
import { getAllPertemuan, submitMeetingFeedback, getStudentFeedbackHistory } from '@/lib/student-actions'
import type { MeetingFeedback, Pertemuan } from '@/lib/types'

type FeedbackMeetingOption = Pick<Pertemuan, 'id' | 'nomor_pertemuan' | 'tanggal'>

export default function FeedbackPage() {
  const [pertemuan, setPertemuan] = useState<FeedbackMeetingOption[]>([])
  const [feedbackHistory, setFeedbackHistory] = useState<MeetingFeedback[]>([])
  const [selectedPertemuan, setSelectedPertemuan] = useState('')
  const [ratingMateri, setRatingMateri] = useState(0)
  const [ratingMentor, setRatingMentor] = useState(0)
  const [komentar, setKomentar] = useState('')
  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      try {
        const [pertemuanData, historyData] = await Promise.all([
          getAllPertemuan(),
          getStudentFeedbackHistory(),
        ])

        if (cancelled) {
          return
        }

        setPertemuan((pertemuanData ?? []) as FeedbackMeetingOption[])
        setFeedbackHistory(historyData)
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading data:', error)
          setMessage({ type: 'error', text: 'Gagal memuat halaman feedback. Silakan login ulang.' })
        }
      } finally {
        if (!cancelled) {
          setLoadingData(false)
        }
      }
    }

    void loadData()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSubmit() {
    if (!selectedPertemuan || ratingMateri === 0 || ratingMentor === 0) {
      setMessage({ type: 'error', text: 'Mohon isi semua rating' })
      return
    }

    setSubmitting(true)
    try {
      const result = await submitMeetingFeedback(selectedPertemuan, ratingMateri, ratingMentor, komentar)
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Feedback berhasil dikirim!' })
        setSelectedPertemuan('')
        setRatingMateri(0)
        setRatingMentor(0)
        setKomentar('')
        setFeedbackHistory(await getStudentFeedbackHistory())
      } else {
        setMessage({ type: 'error', text: result.error || 'Gagal mengirim feedback' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, setRating: (r: number) => void) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div>
          <SkeletonShimmer className="h-8 w-56" />
          <SkeletonShimmer className="mt-2 h-4 w-72" />
        </div>

        <Card>
          <CardHeader>
            <SkeletonShimmer className="h-6 w-52" />
            <SkeletonShimmer className="h-4 w-80" />
          </CardHeader>
          <CardContent className="space-y-6">
            <SkeletonShimmer className="h-10 w-full rounded-md" />
            <SkeletonShimmer className="h-8 w-48" />
            <SkeletonShimmer className="h-8 w-48" />
            <SkeletonShimmer className="h-24 w-full rounded-xl" />
            <SkeletonShimmer className="h-11 w-full rounded-md" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SkeletonShimmer className="h-6 w-44" />
            <SkeletonShimmer className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="rounded-xl border p-4 space-y-3">
                <SkeletonShimmer className="h-4 w-32" />
                <div className="grid grid-cols-2 gap-4">
                  <SkeletonShimmer className="h-4 w-full" />
                  <SkeletonShimmer className="h-4 w-full" />
                </div>
                <SkeletonShimmer className="h-16 w-full rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Feedback Pertemuan</h1>
        <p className="text-muted-foreground mt-1">Berikan penilaian dan feedback untuk pertemuan</p>
      </div>

      {message && (
        <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
          <div className="flex gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </div>
        </Alert>
      )}

      {/* Submit Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Kirim Feedback Baru
          </CardTitle>
          <CardDescription>Beri penilaian untuk pertemuan yang sudah Anda ikuti</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Pilih Pertemuan</Label>
            <Select value={selectedPertemuan} onValueChange={setSelectedPertemuan}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih pertemuan" />
              </SelectTrigger>
              <SelectContent>
                {pertemuan.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    Pertemuan {p.nomor_pertemuan} - {new Date(p.tanggal).toLocaleDateString('id-ID')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Rating Materi ({ratingMateri}/5)</Label>
            {renderStars(ratingMateri, setRatingMateri)}
          </div>

          <div className="space-y-2">
            <Label>Rating Mentor ({ratingMentor}/5)</Label>
            {renderStars(ratingMentor, setRatingMentor)}
          </div>

          <div className="space-y-2">
            <Label>Komentar (Opsional)</Label>
            <Textarea
              placeholder="Tulis komentar atau saran Anda..."
              value={komentar}
              onChange={(e) => setKomentar(e.target.value)}
              className="min-h-24 resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !selectedPertemuan || ratingMateri === 0 || ratingMentor === 0}
            className="w-full"
          >
            {submitting ? 'Mengirim...' : 'Kirim Feedback'}
          </Button>
        </CardContent>
      </Card>

      {/* Feedback History */}
      {feedbackHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Feedback</CardTitle>
            <CardDescription>Feedback yang sudah Anda kirim</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {feedbackHistory.map((feedback) => (
                <div key={feedback.id} className="p-4 rounded-xl border bg-muted/30">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <Badge variant="default">
                        Pertemuan {feedback.pertemuan?.nomor_pertemuan ?? '-'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(feedback.pertemuan?.tanggal ?? feedback.created_at).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium mb-1">Rating Materi</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (feedback.rating_materi || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Rating Mentor</p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= (feedback.rating_mentor || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {feedback.komentar && (
                    <div className="p-3 rounded-lg bg-background border">
                      <p className="text-sm">{feedback.komentar}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
