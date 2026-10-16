import type { ReactNode } from 'react'

import { buildPageList } from '@/hooks/usePagination'
import { cn } from '@/lib/cn'

type PaginationProps = {
  currentPage: number
  totalPages: number
  totalItems: number
  perPage: number
  onPageChange: (page: number) => void
}

/** "Showing 10 – 18 of 23 notes" and the page buttons. Renders nothing for a single page. */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const first = (currentPage - 1) * perPage + 1
  const last = Math.min(currentPage * perPage, totalItems)

  return (
    <nav
      aria-label="Pagination"
      className="animate-fade-in mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
    >
      <p className="text-dim text-sm tabular-nums">
        Showing <span className="text-muted font-medium">{first}</span> –{' '}
        <span className="text-muted font-medium">{last}</span> of{' '}
        <span className="text-muted font-medium">{totalItems}</span> notes
      </p>

      <ul className="flex items-center gap-1">
        <li>
          <PageButton
            label="Previous page"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            <Chevron d="M15 19l-7-7 7-7" />
          </PageButton>
        </li>
        {buildPageList(currentPage, totalPages).map((page, i) =>
          page === 'ellipsis' ? (
            <li key={`ellipsis-${i}`} aria-hidden="true" className="text-dim px-2">
              …
            </li>
          ) : (
            <li key={page}>
              <PageButton
                label={`Page ${page}`}
                current={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PageButton>
            </li>
          ),
        )}
        <li>
          <PageButton
            label="Next page"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            <Chevron d="M9 5l7 7-7 7" />
          </PageButton>
        </li>
      </ul>
    </nav>
  )
}

type PageButtonProps = {
  label: string
  current?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}

function PageButton({ label, current, disabled, onClick, children }: PageButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm font-medium tabular-nums transition-all',
        'focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-40',
        current
          ? 'bg-accent text-on-accent shadow-accent-glow shadow-md'
          : 'text-muted enabled:hover:bg-surface-2 enabled:hover:text-ink',
      )}
    >
      {children}
    </button>
  )
}

function Chevron({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      className="size-4"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}
