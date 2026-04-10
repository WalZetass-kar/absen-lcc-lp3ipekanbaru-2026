'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award } from 'lucide-react'

export function TopStudentsLeaderboard({
  students,
}: {
  students: Array<{ id: string; nama: string; prodi: string; totalKehadiran: number; persentaseKehadiran: number }>
}) {
  const medals = [<Trophy key="1" className="w-5 h-5 text-yellow-500" />, <Medal key="2" className="w-5 h-5 text-gray-400" />, <Medal key="3" className="w-5 h-5 text-orange-600" />]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          Mahasiswa Paling Aktif (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.map((student, index) => (
            <div key={student.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 flex items-center justify-center">
                  {index < 3 ? medals[index] : <span className="text-muted-foreground font-bold">#{index + 1}</span>}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{student.nama}</p>
                  <p className="text-xs text-muted-foreground">{student.prodi}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-sm">{student.totalKehadiran}x</p>
                  <p className="text-xs text-muted-foreground">Kehadiran</p>
                </div>
                <Badge variant={student.persentaseKehadiran >= 80 ? 'default' : student.persentaseKehadiran >= 60 ? 'secondary' : 'destructive'}>
                  {student.persentaseKehadiran}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
