import { useMutation, useQueryClient } from '@tanstack/react-query'

import { ApiError } from '@/api/client'
import { createNote } from '@/api/notes'
import type { NoteIn } from '@/api/types'
import { useToast } from '@/context/ToastContext'
import { useUI } from '@/context/UIContext'

import { invalidateWhenIdle, updateNotes } from './noteCache'
import { noteKeys } from './noteKeys'

export function useCreateNote() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const { reopenCreate, setPage } = useUI()

  return useMutation({
    mutationKey: noteKeys.all,
    mutationFn: (data: NoteIn) => createNote(data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: noteKeys.all })
      // Negative, so it can never collide with a server id.
      const tempId = -Date.now()
      // Prepended, matching the server, which lists notes newest first.
      updateNotes(queryClient, (notes) => [{ ...data, id: tempId, pending: true }, ...notes])
      // ...so the new card is on page 1: show it.
      setPage(1)
      return { tempId }
    },

    onSuccess: (created, _data, context) => {
      updateNotes(queryClient, (notes) => {
        // A refetch may already have brought the real note in; never show it twice.
        const rest = notes.filter((note) => note.id !== created.id)
        return rest.some((note) => note.id === context.tempId)
          ? rest.map((note) => (note.id === context.tempId ? created : note))
          : [created, ...rest]
      })
      toast.success('Note created')
    },

    onError: (error, data, context) => {
      if (context) {
        updateNotes(queryClient, (notes) => notes.filter((note) => note.id !== context.tempId))
      }
      toast.error(`Couldn’t create “${data.title}”. ${error.message}`)
      // The form closed on submit; bring the user's text back so nothing is lost.
      reopenCreate({
        ...data,
        error: error.message,
        fieldErrors: error instanceof ApiError ? error.fieldErrors : undefined,
      })
    },

    onSettled: () => invalidateWhenIdle(queryClient),
  })
}
