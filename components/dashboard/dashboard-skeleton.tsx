import { SkeletonCard, SkeletonShimmer } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// Skeleton untuk statistik kehadiran (4 cards)
export function StatistikKehadiranSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// Skeleton untuk ranking kehadiran
export function RankingKehadiranSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <SkeletonShimmer className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonShimmer className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonShimmer className="h-4 w-3/4" />
                <SkeletonShimmer className="h-3 w-1/2" />
              </div>
              <SkeletonShimmer className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton untuk tabel absensi
export function TabelAbsensiSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left">
                  <SkeletonShimmer className="h-4 w-8" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SkeletonShimmer className="h-4 w-24" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SkeletonShimmer className="h-4 w-32" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SkeletonShimmer className="h-4 w-20" />
                </th>
                <th className="px-4 py-3 text-left">
                  <SkeletonShimmer className="h-4 w-24" />
                </th>
                <th className="px-4 py-3 text-right">
                  <SkeletonShimmer className="h-4 w-16" />
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: rows }).map((_, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <SkeletonShimmer className="h-4 w-8" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SkeletonShimmer className="h-8 w-8 rounded-full shrink-0" />
                      <SkeletonShimmer className="h-4 w-32" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <SkeletonShimmer className="h-4 w-40" />
                  </td>
                  <td className="px-4 py-3">
                    <SkeletonShimmer className="h-6 w-16 rounded-full" />
                  </td>
                  <td className="px-4 py-3">
                    <SkeletonShimmer className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <SkeletonShimmer className="h-7 w-7 rounded-md" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton untuk list mahasiswa
export function MahasiswaListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 hover:bg-muted/20">
              <SkeletonShimmer className="h-12 w-12 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonShimmer className="h-5 w-48" />
                <SkeletonShimmer className="h-4 w-32" />
              </div>
              <div className="space-y-2">
                <SkeletonShimmer className="h-6 w-20 rounded-full" />
                <SkeletonShimmer className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton untuk riwayat absensi
export function RiwayatAbsensiSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <SkeletonShimmer className="h-12 w-12 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonShimmer className="h-5 w-32" />
                  <SkeletonShimmer className="h-6 w-20 rounded-full" />
                </div>
                <SkeletonShimmer className="h-4 w-48" />
                <SkeletonShimmer className="h-3 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// Skeleton untuk form
export function FormSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-6">
        <SkeletonShimmer className="h-6 w-40" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonShimmer className="h-4 w-24" />
              <SkeletonShimmer className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-end">
          <SkeletonShimmer className="h-10 w-24 rounded-md" />
          <SkeletonShimmer className="h-10 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton untuk profil
export function ProfilSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <SkeletonShimmer className="h-32 w-32 rounded-full shrink-0 mx-auto md:mx-0" />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <SkeletonShimmer className="h-7 w-48" />
                <SkeletonShimmer className="h-5 w-32" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <SkeletonShimmer className="h-3 w-20" />
                    <SkeletonShimmer className="h-5 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
