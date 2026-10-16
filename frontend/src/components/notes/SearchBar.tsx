import { useId, type KeyboardEvent } from 'react'

import { useUI } from '@/context/UIContext'
import { cn } from '@/lib/cn'

export function SearchBar({ className }: { className?: string }) {
  const { search, setSearch, searchInputRef } = useUI()
  const inputId = useId()

  function clear() {
    setSearch('')
    searchInputRef.current?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') return
    // First Esc clears the query, the next one leaves the field.
    event.preventDefault()
    if (search) setSearch('')
    else event.currentTarget.blur()
  }

  return (
    <div role="search" className={cn('group relative', className)}>
      <label htmlFor={inputId} className="sr-only">
        Search notes
      </label>
      <svg
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
        className="text-dim group-focus-within:text-accent pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 transition-colors"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11ZM2 9a7 7 0 1 1 12.452 4.391l3.328 3.329a.75.75 0 1 1-1.06 1.06l-3.329-3.328A7 7 0 0 1 2 9Z"
          clipRule="evenodd"
        />
      </svg>
      <input
        ref={searchInputRef}
        id={inputId}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search notes by title or content..."
        autoComplete="off"
        spellCheck={false}
        aria-keyshortcuts="/"
        className={cn(
          'peer border-rule bg-surface text-ink placeholder:text-dim h-11 w-full rounded-xl border pr-10 pl-12 text-sm shadow-sm transition-all',
          'focus:border-accent/60 focus:ring-accent/20 focus:ring-2 focus:outline-none',
          // We draw our own clear button so it looks the same in every browser.
          '[&::-webkit-search-cancel-button]:appearance-none',
        )}
      />
      {search ? (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="text-dim hover:text-ink hover:bg-surface-2 focus-visible:outline-accent absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-lg focus-visible:outline-2"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="size-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      ) : (
        // Hint for keyboard users; hidden on touch screens and once the field has focus.
        <kbd
          aria-hidden="true"
          className="border-rule text-dim pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 rounded-md border px-1.5 font-sans text-xs leading-5 peer-focus:hidden pointer-coarse:hidden"
        >
          /
        </kbd>
      )}
    </div>
  )
}
