import { useQuery } from '@tanstack/react-query'

import { listNotes } from '@/api/notes'

import type { CachedNote } from './noteCache'
import { noteKeys } from './noteKeys'

export function useNotes() {
  return useQuery({
    queryKey: noteKeys.all,
    queryFn: ({ signal }): Promise<CachedNote[]> => listNotes(signal),
  })
}
