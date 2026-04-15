'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SkeletonShimmer } from '@/components/ui/skeleton'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAttendanceCalendar } from '@/lib/student-actions'
import type { CalendarDay } from '@/lib/types'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadCalendar() {
      setLoading(true)
      try {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth() + 1
        const days = await getAttendanceCalendar(year, month)

        if (cancelled) {
          return
        }

        setCalendarDays(days)
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading calendar:', error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadCalendar()

    return () => {
      cancelled = true
    }
  }, [currentDate])

  function previousMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  function nextMonth() {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  function getStatusColor(status?: string) {
    if (!status) return 'bg-muted'
    if (status === 'Hadir') return 'bg-green-500 text-white'
    if (status === 'Izin') return 'bg-yellow-500 text-white'
    if (status === 'Alfa') return 'bg-red-500 text-white'
    return 'bg-muted'
  }

  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Kalender Kehadiran</h1>
        <p className="text-muted-foreground mt-1">Visualisasi kehadiran bulanan Anda</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {monthName}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Klik tanggal untuk melihat detail kehadiran</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, index) => (
                  <SkeletonShimmer key={`calendar-header-${index}`} className="h-8 w-full rounded-md" />
                ))}
                {Array.from({ length: 35 }).map((_, index) => (
                  <SkeletonShimmer key={`calendar-cell-${index}`} className="aspect-square w-full rounded-xl" />
                ))}
              </div>
              <div className="flex flex-wrap gap-4 justify-center">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={`calendar-legend-${index}`} className="flex items-center gap-2">
                    <SkeletonShimmer className="h-6 w-6 rounded-md" />
                    <SkeletonShimmer className="h-4 w-16" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                  <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day) => {
                  const dayNumber = new Date(day.date).getDate()
                  return (
                    <div
                      key={day.date}
                      className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${
                        day.isToday ? 'border-primary' : 'border-border'
                      } ${getStatusColor(day.status)} ${
                        day.status ? 'cursor-pointer hover:scale-105' : ''
                      }`}
                      title={day.status ? `Pertemuan ${day.pertemuan}: ${day.status}` : undefined}
                    >
                      <span className={`text-sm font-semibold ${day.status ? '' : 'text-muted-foreground'}`}>
                        {dayNumber}
                      </span>
                      {day.pertemuan && (
                        <span className="text-xs opacity-90">P{day.pertemuan}</span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-green-500" />
                  <span className="text-sm">Hadir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-yellow-500" />
                  <span className="text-sm">Izin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-red-500" />
                  <span className="text-sm">Alfa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded border-2 border-primary" />
                  <span className="text-sm">Hari Ini</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
