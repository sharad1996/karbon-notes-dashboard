import type { ReactNode } from 'react'

import { Button } from '@/components/ui/Button'
import { useUI } from '@/context/UIContext'

function EmptyLayout({
  title,
  hint,
  action,
}: {
  title: ReactNode
  hint: string
  action: ReactNode
}) {
  return (
    <div className="animate-fade-in-up flex flex-col items-center justify-center py-16 text-center">
      <div className="border-rule bg-surface mb-5 flex size-20 items-center justify-center rounded-2xl border">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1}
          aria-hidden="true"
          className="text-dim size-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <p className="text-muted text-lg font-medium">{title}</p>
      <p className="text-dim mt-1 max-w-sm text-sm">{hint}</p>
      <div className="mt-5">{action}</div>
    </div>
  )
}

export function EmptyState() {
  const { openCreate } = useUI()

  return (
    <EmptyLayout
      title="No notes yet"
      hint="Notes you create will show up here."
      action={
        <Button variant="primary" onClick={openCreate}>
          Create your first note
        </Button>
      }
    />
  )
}

export function NoResults({ query }: { query: string }) {
  const { setSearch, searchInputRef } = useUI()

  function clear() {
    setSearch('')
    // This button disappears with the results message, so put focus somewhere useful.
    searchInputRef.current?.focus()
  }

  return (
    <EmptyLayout
      title={
        <>
          No notes match “<span className="break-all">{query}</span>”
        </>
      }
      hint="Search looks at titles and content. Try fewer or different words."
      action={<Button onClick={clear}>Clear search</Button>}
    />
  )
}
