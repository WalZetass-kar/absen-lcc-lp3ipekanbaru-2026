import { ProfilSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function ProfilLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <SkeletonShimmer className="h-8 w-32" />
        <SkeletonShimmer className="h-4 w-56 mt-2" />
      </div>

      {/* Profile Content */}
      <ProfilSkeleton />
    </div>
  )
}
