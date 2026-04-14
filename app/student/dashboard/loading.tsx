import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function StudentDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <SkeletonShimmer className="h-8 w-48" />
        <SkeletonShimmer className="h-4 w-64 mt-2" />
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <SkeletonShimmer className="h-24 w-24 rounded-full shrink-0" />
            <div className="flex-1 space-y-3 text-center md:text-left w-full">
              <SkeletonShimmer className="h-6 w-48 mx-auto md:mx-0" />
              <SkeletonShimmer className="h-4 w-32 mx-auto md:mx-0" />
              <div className="grid grid-cols-2 gap-3 mt-4">
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

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <SkeletonShimmer className="h-4 w-24" />
                  <SkeletonShimmer className="h-8 w-16" />
                  <SkeletonShimmer className="h-3 w-32" />
                </div>
                <SkeletonShimmer className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <SkeletonShimmer className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                <SkeletonShimmer className="h-12 w-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <SkeletonShimmer className="h-4 w-32" />
                  <SkeletonShimmer className="h-3 w-24" />
                </div>
                <SkeletonShimmer className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
