import { useRef } from 'react'

import { useUI } from '@/context/UIContext'
import { useFilteredNotes } from '@/hooks/useFilteredNotes'
import { useNotes } from '@/hooks/useNotes'
import { usePagination } from '@/hooks/usePagination'
import type { CachedNote } from '@/hooks/noteCache'

import { EmptyState, NoResults } from './EmptyState'
import { ErrorBanner } from './ErrorBanner'
import { NoteCard } from './NoteCard'
import { NoteCardSkeleton } from './NoteCardSkeleton'
import { Pagination } from './Pagination'

const SKELETON_COUNT = 6
const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'

function countLabel(shown: number, total: number, isSearching: boolean) {
  const noun = total === 1 ? 'note' : 'notes'
  return isSearching ? `${shown} of ${total} ${noun}` : `${total} ${noun}`
}

export function NoteGrid() {
  const { error, isPending, isFetching, refetch } = useNotes()
  const { notes, total, query, isSearching } = useFilteredNotes()

  const banner = error && (
    <ErrorBanner message={error.message} onRetry={() => void refetch()} retrying={isFetching} />
  )

  // Stays pending through the automatic retries, so an outage shows skeletons for ~3s first.
  if (isPending) {
    return (
      <div aria-busy="true">
        <span className="sr-only">Loading notes…</span>
        <div className={GRID}>
          {Array.from({ length: SKELETON_COUNT }, (_, i) => (
            <NoteCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // First load failed: nothing to show but the error.
  if (!notes) return banner

  return (
    <div className="flex flex-col gap-4">
      {/* A background refetch failed: keep the last good list on screen under the banner. */}
      {banner}
      {/* A status region, so screen readers hear how many notes match as the query changes. */}
      <p role="status" className="text-muted text-sm tabular-nums">
        {total > 0 && countLabel(notes.length, total, isSearching)}
      </p>
      {total === 0 ? (
        <EmptyState />
      ) : notes.length === 0 ? (
        <NoResults query={query} />
      ) : (
        <PagedNotes notes={notes} />
      )}
    </div>
  )
}

function PagedNotes({ notes }: { notes: CachedNote[] }) {
  const { page, setPage } = useUI()
  const { currentPage, totalPages, pageItems, perPage } = usePagination(notes, page)
  const listRef = useRef<HTMLUListElement>(null)

  function goToPage(next: number) {
    setPage(next)
    // The buttons sit under the grid; bring the new page's first row into view. Focus moves
    // with it, so keyboard users continue from the top of the new page (and aren't stranded
    // when Next turns disabled on the last page).
    listRef.current?.focus({ preventScroll: true })
    listRef.current?.scrollIntoView?.({ block: 'start' })
  }

  return (
    <>
      <ul
        ref={listRef}
        tabIndex={-1}
        aria-label="Notes"
        className={`${GRID} scroll-mt-28 outline-none`}
      >
        {pageItems.map((note, index) => (
          <li key={note.id}>
            <NoteCard note={note} index={index} />
          </li>
        ))}
      </ul>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={notes.length}
        perPage={perPage}
        onPageChange={goToPage}
      />
    </>
  )
}
