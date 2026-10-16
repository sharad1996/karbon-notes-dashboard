import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/api/client'
import { deleteNote } from '@/api/notes'
import { useToast } from '@/context/ToastContext'

import { getCachedNotes, invalidateWhenIdle, updateNotes } from './noteCache'
import { noteKeys } from './noteKeys'

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: noteKeys.all,
    mutationFn: async (id: number) => {
      try {
        await deleteNote(id)
      } catch (error) {
        // Already gone (deleted in another tab, say): that's the outcome the user asked for.
        if (error instanceof ApiError && error.status === 404) return
        throw error
      }
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all })
      const notes = getCachedNotes(queryClient)
      const index = notes.findIndex((note) => note.id === id)
      updateNotes(queryClient, (current) => current.filter((note) => note.id !== id))
      return { note: notes[index], index }
    },

    onSuccess: () => toast.success('Note deleted'),

    onError: (error, id, context) => {
      const note = context?.note
      if (note) {
        // Put it back where it was, unless a refetch already has.
        updateNotes(queryClient, (notes) =>
          notes.some((n) => n.id === id) ? notes : notes.toSpliced(context.index, 0, note),
        )
      }
      toast.error(`Couldn’t delete “${note?.title ?? 'the note'}”. ${error.message}`)
    },

    onSettled: () => invalidateWhenIdle(queryClient),
  })
}
