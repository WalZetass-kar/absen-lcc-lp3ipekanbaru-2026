import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div>
        <SkeletonShimmer className="h-8 w-48" />
        <SkeletonShimmer className="h-4 w-64 mt-2" />
      </div>

      {/* Activity Status Skeleton */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <SkeletonShimmer className="h-5 w-40" />
              <SkeletonShimmer className="h-4 w-56" />
            </div>
            <SkeletonShimmer className="h-10 w-32 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid - 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <SkeletonShimmer className="h-4 w-24" />
                  <SkeletonShimmer className="h-9 w-16" />
                </div>
                <SkeletonShimmer className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Mahasiswa per Kelas & Tingkat Kehadiran */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Mahasiswa per Kelas */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <SkeletonShimmer className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <SkeletonShimmer className="h-4 w-32" />
                    <SkeletonShimmer className="h-4 w-24" />
                  </div>
                  <SkeletonShimmer className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tingkat Kehadiran */}
        <Card>
          <CardHeader className="pb-3">
            <SkeletonShimmer className="h-5 w-40" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-4">
            <SkeletonShimmer className="h-28 w-28 rounded-full" />
            <SkeletonShimmer className="h-4 w-32 mt-4" />
            <div className="mt-3 grid grid-cols-3 gap-2 w-full">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center space-y-1">
                  <SkeletonShimmer className="h-5 w-8 mx-auto" />
                  <SkeletonShimmer className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Section */}
      <div className="space-y-6">
        <SkeletonShimmer className="h-7 w-56" />

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className={i === 2 ? 'lg:col-span-2' : ''}>
              <CardHeader>
                <SkeletonShimmer className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <SkeletonShimmer className="h-64 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Top Students & Low Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <SkeletonShimmer className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkeletonShimmer className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonShimmer className="h-4 w-32" />
                      <SkeletonShimmer className="h-3 w-24" />
                    </div>
                    <SkeletonShimmer className="h-6 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <SkeletonShimmer className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <SkeletonShimmer className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <SkeletonShimmer className="h-4 w-40" />
                      <SkeletonShimmer className="h-3 w-32" />
                    </div>
                    <SkeletonShimmer className="h-8 w-20 rounded-md" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
