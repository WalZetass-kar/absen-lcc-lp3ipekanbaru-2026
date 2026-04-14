import { RiwayatAbsensiSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function AttendanceHistoryLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <SkeletonShimmer className="h-8 w-48" />
        <SkeletonShimmer className="h-4 w-64 mt-2" />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <SkeletonShimmer className="h-4 w-20" />
                <SkeletonShimmer className="h-7 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <SkeletonShimmer className="h-10 flex-1 rounded-md" />
            <SkeletonShimmer className="h-10 w-full md:w-48 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <RiwayatAbsensiSkeleton count={8} />
    </div>
  )
}
