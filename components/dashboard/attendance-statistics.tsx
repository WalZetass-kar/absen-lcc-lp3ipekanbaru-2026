'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp } from 'lucide-react'

export function AttendanceStatistics({
  byMeeting,
  byProdi,
  trend,
}: {
  byMeeting: Array<{ pertemuan: string; hadir: number; izin: number; alfa: number }>
  byProdi: Array<{ prodi: string; kehadiran: number; hadir: number; total: number }>
  trend: Array<{ tanggal: string; persentase: number }>
}) {
  return (
    <div className="space-y-6">
      {/* Attendance by Meeting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Kehadiran per Pertemuan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={byMeeting}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="pertemuan" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hadir" fill="#10b981" name="Hadir" />
              <Bar dataKey="izin" fill="#f59e0b" name="Izin" />
              <Bar dataKey="alfa" fill="#ef4444" name="Alfa" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Attendance by Study Program */}
      <Card>
        <CardHeader>
          <CardTitle>Kehadiran per Program Studi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {byProdi.map(item => (
            <div key={item.prodi} className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">{item.prodi}</p>
                <span className="text-sm font-semibold text-foreground">{item.kehadiran}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all rounded-full ${
                    item.kehadiran >= 80
                      ? 'bg-emerald-500'
                      : item.kehadiran >= 60
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${item.kehadiran}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">{item.hadir} dari {item.total} catatan</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Attendance Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Tren Kehadiran
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tanggal" angle={-45} textAnchor="end" height={60} />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Line
                type="monotone"
                dataKey="persentase"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="Persentase Kehadiran"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
