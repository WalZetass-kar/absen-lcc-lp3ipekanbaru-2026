import { getLeaderboard } from '@/lib/student-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, User } from 'lucide-react'

// Force dynamic rendering to avoid build-time database calls
export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard(20)

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500">🥇 Juara 1</Badge>
    if (rank === 2) return <Badge className="bg-gray-400">🥈 Juara 2</Badge>
    if (rank === 3) return <Badge className="bg-amber-600">🥉 Juara 3</Badge>
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Leaderboard Kehadiran</h1>
        <p className="text-muted-foreground mt-1">Ranking mahasiswa berdasarkan persentase kehadiran</p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* 2nd Place */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-2 border-gray-300">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-3">
                <Medal className="w-12 h-12 text-gray-400" />
              </div>
              <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-gray-300">
                {leaderboard[1].profile_photo_url ? (
                  <img src={leaderboard[1].profile_photo_url} alt={leaderboard[1].nama} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-bold text-sm truncate">{leaderboard[1].nama}</h3>
              <p className="text-xs text-muted-foreground">{leaderboard[1].kelas}</p>
              <p className="text-2xl font-bold text-gray-600 mt-2">{leaderboard[1].attendance_percentage}%</p>
              <p className="text-xs text-muted-foreground">{leaderboard[1].hadir_count}/{leaderboard[1].total_pertemuan} hadir</p>
            </CardContent>
          </Card>

          {/* 1st Place */}
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 border-2 border-yellow-400 transform scale-105">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-3">
                <Trophy className="w-16 h-16 text-yellow-500" />
              </div>
              <div className="w-20 h-20 mx-auto mb-3 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-yellow-400">
                {leaderboard[0].profile_photo_url ? (
                  <img src={leaderboard[0].profile_photo_url} alt={leaderboard[0].nama} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-bold truncate">{leaderboard[0].nama}</h3>
              <p className="text-xs text-muted-foreground">{leaderboard[0].kelas}</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{leaderboard[0].attendance_percentage}%</p>
              <p className="text-xs text-muted-foreground">{leaderboard[0].hadir_count}/{leaderboard[0].total_pertemuan} hadir</p>
            </CardContent>
          </Card>

          {/* 3rd Place */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900 dark:to-amber-800 border-2 border-amber-500">
            <CardContent className="pt-6 text-center">
              <div className="flex justify-center mb-3">
                <Award className="w-12 h-12 text-amber-600" />
              </div>
              <div className="w-16 h-16 mx-auto mb-3 rounded-full overflow-hidden bg-muted flex items-center justify-center border-4 border-amber-500">
                {leaderboard[2].profile_photo_url ? (
                  <img src={leaderboard[2].profile_photo_url} alt={leaderboard[2].nama} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <h3 className="font-bold text-sm truncate">{leaderboard[2].nama}</h3>
              <p className="text-xs text-muted-foreground">{leaderboard[2].kelas}</p>
              <p className="text-2xl font-bold text-amber-600 mt-2">{leaderboard[2].attendance_percentage}%</p>
              <p className="text-xs text-muted-foreground">{leaderboard[2].hadir_count}/{leaderboard[2].total_pertemuan} hadir</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Lengkap</CardTitle>
          <CardDescription>Top 20 mahasiswa dengan kehadiran terbaik</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((student, index) => {
              const rank = index + 1
              return (
                <div
                  key={student.id}
                  className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                    rank <= 3 ? 'bg-muted/50' : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="w-12 flex items-center justify-center">
                    {getRankIcon(rank)}
                  </div>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center border-2 border-border">
                    {student.profile_photo_url ? (
                      <img src={student.profile_photo_url} alt={student.nama} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{student.nama}</h3>
                      {getRankBadge(rank)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {student.kelas} • {student.nim || '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{student.attendance_percentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {student.hadir_count}/{student.total_pertemuan} hadir
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
