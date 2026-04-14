import { MahasiswaListSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function MahasiswaLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonShimmer className="h-8 w-48" />
          <SkeletonShimmer className="h-4 w-64 mt-2" />
        </div>
        <SkeletonShimmer className="h-10 w-40 rounded-md" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <SkeletonShimmer className="h-4 w-32" />
                  <SkeletonShimmer className="h-8 w-16" />
                </div>
                <SkeletonShimmer className="h-10 w-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <SkeletonShimmer className="h-10 flex-1 rounded-md" />
            <SkeletonShimmer className="h-10 w-full md:w-48 rounded-md" />
            <SkeletonShimmer className="h-10 w-24 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Mahasiswa List */}
      <MahasiswaListSkeleton count={8} />

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <SkeletonShimmer className="h-4 w-40" />
        <div className="flex gap-2">
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
          <SkeletonShimmer className="h-9 w-9 rounded-md" />
        </div>
      </div>
    </div>
  )
}
