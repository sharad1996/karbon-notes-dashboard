import { useMemo } from 'react'

import { useUI } from '@/context/UIContext'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'

import type { CachedNote } from './noteCache'
import { useDebounce } from './useDebounce'
import { useNotes } from './useNotes'

function matches(note: CachedNote, terms: string[]) {
  const text = `${note.title}\n${note.content}`.toLocaleLowerCase()
  return terms.every((term) => text.includes(term))
}

/**
 * The cached list narrowed by the search box: case-insensitive, and every word must appear
 * in the title or content. Client-side, so it works on pending notes too.
 *
 * The box updates on every keystroke; only the filtering waits for typing to pause.
 * Clearing the box is the exception: the full list comes back at once.
 */
export function useFilteredNotes() {
  const { data: notes } = useNotes()
  const { search } = useUI()

  const debounced = useDebounce(search, SEARCH_DEBOUNCE_MS)
  const query = search.trim() === '' ? '' : debounced.trim()

  const terms = useMemo(() => query.toLocaleLowerCase().split(/\s+/).filter(Boolean), [query])

  const filtered = useMemo(
    () => (notes && terms.length > 0 ? notes.filter((note) => matches(note, terms)) : notes),
    [notes, terms],
  )

  return { notes: filtered, total: notes?.length ?? 0, query, isSearching: terms.length > 0 }
}
