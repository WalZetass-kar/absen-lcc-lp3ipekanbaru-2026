import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { SkeletonShimmer } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonShimmer className="h-12 w-12 rounded-2xl" />
            <div className="space-y-2">
              <SkeletonShimmer className="h-5 w-40" />
              <SkeletonShimmer className="h-4 w-56" />
            </div>
          </div>
          <SkeletonShimmer className="h-10 w-32 rounded-xl" />
        </div>

        <Card>
          <CardHeader className="space-y-3">
            <SkeletonShimmer className="h-10 w-2/3" />
            <SkeletonShimmer className="h-5 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <SkeletonShimmer className="h-48 w-full rounded-3xl" />
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <SkeletonShimmer key={index} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-6">
                <SkeletonShimmer className="h-6 w-40" />
                <SkeletonShimmer className="h-4 w-full" />
                <SkeletonShimmer className="h-4 w-5/6" />
                <SkeletonShimmer className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
