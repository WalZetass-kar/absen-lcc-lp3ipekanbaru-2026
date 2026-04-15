import { TabelAbsensiSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function AdminLoading() {
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

      {/* Admin Table */}
      <TabelAbsensiSkeleton rows={5} />
    </div>
  )
}
