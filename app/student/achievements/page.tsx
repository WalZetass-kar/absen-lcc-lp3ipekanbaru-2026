import { getStudentAchievements, getStudentAttendanceStats } from '@/lib/student-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star, Award } from 'lucide-react'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function AchievementsPage() {
  const [achievements, stats] = await Promise.all([
    getStudentAchievements(),
    getStudentAttendanceStats(),
  ])

  const potentialAchievements = [
    {
      type: 'perfect_attendance',
      name: 'Perfect Attendance',
      description: 'Capai 100% kehadiran',
      icon: '🏆',
      unlocked: stats.percentage === 100 && stats.total >= 5,
      progress: stats.percentage,
    },
    {
      type: 'early_bird',
      name: 'Early Bird',
      description: '5 kehadiran berturut-turut',
      icon: '🐦',
      unlocked: achievements.some(a => a.achievement_type === 'early_bird'),
      progress: null,
    },
    {
      type: 'comeback_king',
      name: 'Comeback King',
      description: 'Tingkatkan kehadiran ke 80%+',
      icon: '👑',
      unlocked: stats.percentage >= 80 && stats.total >= 10,
      progress: stats.percentage,
    },
    {
      type: 'dedicated_learner',
      name: 'Dedicated Learner',
      description: 'Hadir 10 pertemuan',
      icon: '📚',
      unlocked: stats.hadir >= 10,
      progress: (stats.hadir / 10) * 100,
    },
    {
      type: 'attendance_master',
      name: 'Attendance Master',
      description: 'Hadir 15 pertemuan',
      icon: '⭐',
      unlocked: stats.hadir >= 15,
      progress: (stats.hadir / 15) * 100,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Achievement & Badge</h1>
        <p className="text-muted-foreground mt-1">Koleksi pencapaian dan badge Anda</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{achievements.length}</p>
            <p className="text-xs text-muted-foreground">Badge Terkumpul</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Star className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.percentage}%</p>
            <p className="text-xs text-muted-foreground">Kehadiran</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.hadir}</p>
            <p className="text-xs text-muted-foreground">Total Hadir</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <p className="text-2xl font-bold">{potentialAchievements.filter(a => a.unlocked).length}/{potentialAchievements.length}</p>
            <p className="text-xs text-muted-foreground">Terbuka</p>
          </CardContent>
        </Card>
      </div>

      {/* Unlocked Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Badge Terkumpul</CardTitle>
            <CardDescription>Achievement yang sudah Anda raih</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="flex items-center gap-4 p-4 rounded-xl border bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300"
                >
                  <div className="text-4xl">{achievement.icon || '🏆'}</div>
                  <div className="flex-1">
                    <h3 className="font-bold">{achievement.achievement_name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.achievement_description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Diraih: {new Date(achievement.earned_at).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Badge variant="default">Unlocked</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Achievements (Locked & Unlocked) */}
      <Card>
        <CardHeader>
          <CardTitle>Semua Achievement</CardTitle>
          <CardDescription>Kumpulkan semua badge dengan rajin hadir</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {potentialAchievements.map((achievement) => (
              <div
                key={achievement.type}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-300'
                    : 'bg-muted/30 border-border opacity-60'
                }`}
              >
                <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                  {achievement.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.progress !== null && !achievement.unlocked && (
                    <div className="mt-2">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(100, achievement.progress)}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Progress: {Math.round(achievement.progress)}%
                      </p>
                    </div>
                  )}
                </div>
                {achievement.unlocked ? (
                  <Badge variant="default" className="bg-green-600">✓ Unlocked</Badge>
                ) : (
                  <Badge variant="secondary">🔒 Locked</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
