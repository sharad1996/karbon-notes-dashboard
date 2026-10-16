import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildPageList, usePagination } from './usePagination'

const numbers = (count: number) => Array.from({ length: count }, (_, i) => i + 1)

describe('usePagination', () => {
  it('slices nine items per page', () => {
    const { result } = renderHook(() => usePagination(numbers(20), 2))

    expect(result.current.totalPages).toBe(3)
    expect(result.current.currentPage).toBe(2)
    expect(result.current.pageItems).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18])
  })

  it('falls back to the last page when the list shrinks under the current one', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 3), {
      initialProps: { items: numbers(19) },
    })
    expect(result.current.pageItems).toEqual([19])

    // The only note on page 3 is deleted.
    rerender({ items: numbers(18) })
    expect(result.current.currentPage).toBe(2)
    expect(result.current.pageItems).toEqual([10, 11, 12, 13, 14, 15, 16, 17, 18])
  })

  it('always has at least one (empty) page', () => {
    const { result } = renderHook(() => usePagination([], 4))

    expect(result.current).toMatchObject({ currentPage: 1, totalPages: 1, pageItems: [] })
  })
})

describe('buildPageList', () => {
  it('lists every page when there are seven or fewer', () => {
    expect(buildPageList(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7])
  })

  it('collapses the far end near the start', () => {
    expect(buildPageList(2, 12)).toEqual([1, 2, 3, 'ellipsis', 12])
  })

  it('collapses both ends in the middle', () => {
    expect(buildPageList(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12])
  })

  it('collapses the near end at the end', () => {
    expect(buildPageList(12, 12)).toEqual([1, 'ellipsis', 11, 12])
  })
})
