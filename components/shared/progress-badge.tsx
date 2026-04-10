'use client'

import { Award, Trophy, Zap } from 'lucide-react'
import type { BadgeType } from '@/lib/types'

interface ProgressBadgeProps {
  badgeType: BadgeType
  attendanceCount: number
  size?: 'sm' | 'md' | 'lg'
}

const badgeConfig = {
  Bronze: { color: 'bg-amber-100', textColor: 'text-amber-700', borderColor: 'border-amber-300', icon: Award },
  Silver: { color: 'bg-gray-100', textColor: 'text-gray-700', borderColor: 'border-gray-300', icon: Award },
  Gold: { color: 'bg-yellow-100', textColor: 'text-yellow-700', borderColor: 'border-yellow-300', icon: Trophy },
  Platinum: { color: 'bg-blue-100', textColor: 'text-blue-700', borderColor: 'border-blue-300', icon: Zap },
}

const sizeConfig = {
  sm: 'w-12 h-12 text-xs',
  md: 'w-16 h-16 text-sm',
  lg: 'w-24 h-24 text-base',
}

export function ProgressBadge({ badgeType, attendanceCount, size = 'md' }: ProgressBadgeProps) {
  const config = badgeConfig[badgeType]
  const Icon = config.icon
  const sizeClass = sizeConfig[size]
  
  return (
    <div className={`${sizeClass} ${config.color} ${config.borderColor} rounded-full border-2 flex flex-col items-center justify-center gap-0.5`}>
      <Icon className={`w-5 h-5 ${config.textColor}`} />
      <span className={`font-bold ${config.textColor} leading-none`}>{badgeType}</span>
      <span className={`text-xs ${config.textColor} leading-none`}>{attendanceCount}x</span>
    </div>
  )
}
