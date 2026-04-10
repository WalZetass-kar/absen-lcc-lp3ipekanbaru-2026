export interface PaginationState {
  page: number
  perPage: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export function paginate<T>(
  data: T[],
  page: number,
  perPage: number = 10
): PaginatedResult<T> {
  const total = data.length
  const totalPages = Math.ceil(total / perPage)
  const start = (page - 1) * perPage
  const end = start + perPage
  const paginatedData = data.slice(start, end)

  return {
    data: paginatedData,
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  }
}

export function getPaginationRange(page: number, totalPages: number, range: number = 3) {
  const start = Math.max(1, page - range)
  const end = Math.min(totalPages, page + range)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
