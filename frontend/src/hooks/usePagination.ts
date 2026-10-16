import { useMemo } from 'react'

import { NOTES_PER_PAGE } from '@/lib/constants'

export type PageListItem = number | 'ellipsis'

/**
 * The page buttons to show: every page when there are 7 or fewer, otherwise the first,
 * the last, and the current page with its neighbours, with gaps marked `'ellipsis'`.
 */
export function buildPageList(current: number, total: number): PageListItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: PageListItem[] = [1]
  if (current > 3) pages.push('ellipsis')
  for (let page = Math.max(2, current - 1); page <= Math.min(total - 1, current + 1); page++) {
    pages.push(page)
  }
  if (current < total - 2) pages.push('ellipsis')
  pages.push(total)
  return pages
}

/**
 * One page of `items`. The requested `page` is clamped to the pages that exist, so when the
 * list shrinks (a delete, a narrower search) the grid lands on the new last page by itself.
 */
export function usePagination<T>(items: readonly T[], page: number, perPage = NOTES_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  const currentPage = Math.min(Math.max(1, page), totalPages)

  const pageItems = useMemo(
    () => items.slice((currentPage - 1) * perPage, currentPage * perPage),
    [items, currentPage, perPage],
  )

  return { currentPage, totalPages, pageItems, perPage }
}
