import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Skeleton dengan efek shimmer
function SkeletonShimmer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted",
        className
      )}
      {...props}
    />
  )
}

// Skeleton untuk card statistik
function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <SkeletonShimmer className="h-4 w-24" />
      <SkeletonShimmer className="h-8 w-32" />
      <SkeletonShimmer className="h-3 w-40" />
    </div>
  )
}

// Skeleton untuk tabel row
function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonShimmer className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

// Skeleton untuk list item dengan avatar
function SkeletonListItem() {
  return (
    <div className="flex items-center gap-3 p-4 border-b">
      <SkeletonShimmer className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonShimmer className="h-4 w-3/4" />
        <SkeletonShimmer className="h-3 w-1/2" />
      </div>
    </div>
  )
}

// Skeleton untuk form input
function SkeletonInput() {
  return (
    <div className="space-y-2">
      <SkeletonShimmer className="h-4 w-20" />
      <SkeletonShimmer className="h-10 w-full rounded-md" />
    </div>
  )
}

export { 
  Skeleton, 
  SkeletonShimmer,
  SkeletonCard, 
  SkeletonTableRow, 
  SkeletonListItem,
  SkeletonInput 
}
