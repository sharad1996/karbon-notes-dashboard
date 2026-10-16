import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/api/client'
import { updateNote } from '@/api/notes'
import type { NoteIn } from '@/api/types'
import { useToast } from '@/context/ToastContext'

import { getCachedNotes, invalidateWhenIdle, updateNotes } from './noteCache'
import { noteKeys } from './noteKeys'

type UpdateNoteVariables = { id: number; data: NoteIn }

export function useUpdateNote() {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationKey: noteKeys.all,
    mutationFn: ({ id, data }: UpdateNoteVariables) => updateNote(id, data),

    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all })
      // Remember only this note: rolling back a whole-list snapshot would also undo any
      // other mutation that succeeded in the meantime.
      const previous = getCachedNotes(queryClient).find((note) => note.id === id)
      updateNotes(queryClient, (notes) =>
        notes.map((note) => (note.id === id ? { ...note, ...data, pending: true } : note)),
      )
      return { previous }
    },

    onSuccess: (updated) => {
      updateNotes(queryClient, (notes) =>
        notes.map((note) => (note.id === updated.id ? updated : note)),
      )
      toast.success('Note saved')
    },

    onError: (error, { id, data }, context) => {
      if (error instanceof ApiError && error.status === 404) {
        updateNotes(queryClient, (notes) => notes.filter((note) => note.id !== id))
        toast.error(`“${data.title}” was deleted elsewhere, so your changes couldn’t be saved.`)
        return
      }
      const previous = context?.previous
      if (previous) {
        updateNotes(queryClient, (notes) => notes.map((note) => (note.id === id ? previous : note)))
      }
      toast.error(`Couldn’t save “${data.title}”. ${error.message}`)
    },

    onSettled: () => invalidateWhenIdle(queryClient),
  })
}
