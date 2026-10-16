import type { QueryClient } from '@tanstack/react-query'

import type { Note } from '@/api/types'

import { noteKeys } from './noteKeys'

/** A note as held in the list cache. `pending` is client-only: an optimistic write the server hasn't confirmed yet. */
export type CachedNote = Note & { pending?: boolean }

/** Edit the cached list in place. A no-op while the list hasn't loaded. */
export function updateNotes(
  queryClient: QueryClient,
  update: (notes: CachedNote[]) => CachedNote[],
) {
  queryClient.setQueryData<CachedNote[]>(noteKeys.all, (notes) => notes && update(notes))
}

export function getCachedNotes(queryClient: QueryClient) {
  return queryClient.getQueryData<CachedNote[]>(noteKeys.all) ?? []
}

/**
 * Refetch only when the last in-flight note mutation settles. Refetching earlier would pull
 * server state that predates the other mutations: a note mid-delete would reappear, and a
 * note mid-create would vanish, until they too settled.
 */
export function invalidateWhenIdle(queryClient: QueryClient) {
  // The settling mutation still counts itself, hence 1 rather than 0.
  if (queryClient.isMutating({ mutationKey: noteKeys.all }) === 1) {
    return queryClient.invalidateQueries({ queryKey: noteKeys.all })
  }
}
