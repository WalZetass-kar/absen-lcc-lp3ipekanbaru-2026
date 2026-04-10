'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PaginatedResult } from '@/lib/pagination'
import { getPaginationRange } from '@/lib/pagination'

interface PaginationProps<T> {
  result: PaginatedResult<T>
  onPageChange: (page: number) => void
}

export function Pagination<T>({ result, onPageChange }: PaginationProps<T>) {
  const pages = getPaginationRange(result.page, result.totalPages, 2)

  return (
    <div className="flex items-center justify-between py-4 px-4 border-t border-border">
      <div className="text-sm text-muted-foreground">
        Menampilkan {(result.page - 1) * result.perPage + 1}-{Math.min(result.page * result.perPage, result.total)} dari {result.total}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(result.page - 1)}
          disabled={!result.hasPrevPage}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pages.map(p => (
          <Button
            key={p}
            variant={p === result.page ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(result.page + 1)}
          disabled={!result.hasNextPage}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
