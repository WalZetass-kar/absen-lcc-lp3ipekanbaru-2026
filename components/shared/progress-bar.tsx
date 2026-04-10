'use client'

interface ProgressBarProps {
  percentage: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  animated?: boolean
}

export function ProgressBar({ percentage, showLabel = true, size = 'md', animated = true }: ProgressBarProps) {
  const heightMap = { sm: 'h-2', md: 'h-3', lg: 'h-4' }
  
  const getColor = () => {
    if (percentage >= 80) return 'bg-emerald-500'
    if (percentage >= 60) return 'bg-amber-500'
    return 'bg-red-500'
  }
  
  return (
    <div className="space-y-1.5">
      <div className={`w-full ${heightMap[size]} bg-muted rounded-full overflow-hidden`}>
        <div
          className={`${heightMap[size]} ${getColor()} rounded-full transition-all duration-300 ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Kehadiran</span>
          <span className={`font-semibold ${percentage >= 80 ? 'text-emerald-600' : percentage >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
            {percentage}%
          </span>
        </div>
      )}
    </div>
  )
}
