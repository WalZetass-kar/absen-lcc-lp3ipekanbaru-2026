import { TabelAbsensiSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function AbsensiLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonShimmer className="h-8 w-48" />
          <SkeletonShimmer className="h-4 w-64 mt-2" />
        </div>
        <SkeletonShimmer className="h-10 w-32 rounded-md" />
      </div>

      {/* Filter Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <SkeletonShimmer className="h-10 flex-1 rounded-md" />
            <SkeletonShimmer className="h-10 w-full md:w-48 rounded-md" />
            <SkeletonShimmer className="h-10 w-full md:w-48 rounded-md" />
            <SkeletonShimmer className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <TabelAbsensiSkeleton rows={10} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <SkeletonShimmer className="h-4 w-40" />
        <div className="flex gap-2">
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  )
}
