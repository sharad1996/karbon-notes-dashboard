import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { deleteNote, listNotes } from '@/api/notes'
import { apiError, deferred, makeNote } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'

vi.mock('@/api/notes')

const cardTitles = () =>
  screen.queryAllByRole('article').map((card) => within(card).getByRole('heading').textContent)

async function deleteViaUI(title: string) {
  const rendered = renderWithProviders(<App />)
  const { user } = rendered
  await screen.findByRole('article', { name: title })
  await user.click(screen.getByRole('button', { name: `Delete note: ${title}` }))
  const dialog = screen.getByRole('dialog', { name: 'Delete this note?' })
  await user.click(within(dialog).getByRole('button', { name: 'Delete' }))
  return rendered
}

describe('useDeleteNote', () => {
  it('removes the card at once, then puts it back in place with a toast when the server fails', async () => {
    // Newest first, as the server lists them.
    const notes = [
      makeNote({ title: 'Third' }),
      makeNote({ title: 'Second' }),
      makeNote({ title: 'First' }),
    ]
    vi.mocked(listNotes).mockResolvedValue(notes)
    const response = deferred<void>()
    vi.mocked(deleteNote).mockReturnValue(response.promise)

    await deleteViaUI('Second')

    // Optimistic: gone before the server has answered.
    expect(cardTitles()).toEqual(['Third', 'First'])

    // Hold the refetch that follows the failure, so what we see next is the rollback alone.
    const refetch = deferred<typeof notes>()
    vi.mocked(listNotes).mockReturnValue(refetch.promise)
    response.reject(apiError(500, 'Internal Server Error'))

    expect(
      await screen.findByText('Couldn’t delete “Second”. Internal Server Error'),
    ).toBeInTheDocument()
    expect(cardTitles()).toEqual(['Third', 'Second', 'First'])

    // And the server's answer agrees with it.
    await waitFor(() => expect(listNotes).toHaveBeenCalledTimes(2))
    refetch.resolve(notes)
    await waitFor(() => expect(cardTitles()).toEqual(['Third', 'Second', 'First']))
  })

  it('treats a 404 as success: the note is gone either way', async () => {
    vi.mocked(listNotes).mockResolvedValue([makeNote({ title: 'Only' })])
    // Deleted in another tab while this request was in flight.
    vi.mocked(deleteNote).mockImplementation(async () => {
      vi.mocked(listNotes).mockResolvedValue([])
      throw apiError(404, 'Note not found')
    })

    await deleteViaUI('Only')

    expect(await screen.findByText('Note deleted')).toBeInTheDocument()
    expect(cardTitles()).toEqual([])
  })
})
