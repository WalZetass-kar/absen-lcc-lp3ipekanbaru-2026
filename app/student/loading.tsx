import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function StudentSectionLoading() {
  return (
    <div className="space-y-6">
      <div>
        <SkeletonShimmer className="h-8 w-56" />
        <SkeletonShimmer className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-5">
              <SkeletonShimmer className="h-4 w-24" />
              <SkeletonShimmer className="h-8 w-16" />
              <SkeletonShimmer className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <SkeletonShimmer className="h-6 w-40" />
            <SkeletonShimmer className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border p-4 space-y-2">
                <SkeletonShimmer className="h-4 w-40" />
                <SkeletonShimmer className="h-4 w-full" />
                <SkeletonShimmer className="h-4 w-4/5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <SkeletonShimmer className="h-6 w-44" />
            <SkeletonShimmer className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonShimmer className="h-10 w-full rounded-md" />
            <SkeletonShimmer className="h-24 w-full rounded-xl" />
            <SkeletonShimmer className="h-11 w-full rounded-md" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonShimmer key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
