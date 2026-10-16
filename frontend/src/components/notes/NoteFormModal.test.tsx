import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { createNote, listNotes } from '@/api/notes'
import { deferred, makeNote, validationError } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'

vi.mock('@/api/notes')

async function openCreateForm() {
  vi.mocked(listNotes).mockResolvedValue([])
  const rendered = renderWithProviders(<App />)
  await screen.findByText('No notes yet')
  await rendered.user.click(screen.getByRole('button', { name: 'New note' }))
  const dialog = screen.getByRole('dialog', { name: 'Add New Note' })
  return { ...rendered, dialog }
}

describe('NoteFormModal', () => {
  it('creates a note through the API and shows it in the grid', async () => {
    const { user, dialog } = await openCreateForm()
    const created = makeNote({ title: 'Buy milk', content: 'Oat, not dairy' })
    const response = deferred<typeof created>()
    vi.mocked(createNote).mockReturnValue(response.promise)

    const title = within(dialog).getByLabelText('Title')
    expect(title).toHaveFocus()
    await user.type(title, '  Buy milk  ')
    await user.type(within(dialog).getByLabelText('Content'), 'Oat, not dairy')
    await user.click(within(dialog).getByRole('button', { name: 'Add Note' }))

    expect(createNote).toHaveBeenCalledWith({ title: 'Buy milk', content: 'Oat, not dairy' })

    // Optimistic: the form closes and the card appears before the server answers.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const card = await screen.findByRole('article', { name: 'Buy milk' })
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(card).toHaveTextContent('Oat, not dairy')

    // The refetch after the create sees the server's list.
    vi.mocked(listNotes).mockResolvedValue([created])
    response.resolve(created)

    expect(await screen.findByText('Note created')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByRole('article', { name: 'Buy milk' })).not.toHaveAttribute('aria-busy'),
    )
    expect(screen.getAllByRole('article')).toHaveLength(1)
  })

  it('keeps Save disabled until the title has non-blank text', async () => {
    const { user, dialog } = await openCreateForm()
    const save = within(dialog).getByRole('button', { name: 'Add Note' })

    expect(save).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Title'), '   ')
    expect(save).toBeDisabled()
    await user.type(within(dialog).getByLabelText('Title'), 'x')
    expect(save).toBeEnabled()
  })

  it('reopens with the draft and the server’s field error when the create is rejected', async () => {
    const { user, dialog } = await openCreateForm()
    vi.mocked(createNote).mockRejectedValue(validationError('title', 'Title is already taken'))

    await user.type(within(dialog).getByLabelText('Title'), 'Duplicate')
    await user.type(within(dialog).getByLabelText('Content'), 'my words')
    await user.click(within(dialog).getByRole('button', { name: 'Add Note' }))

    const reopened = await screen.findByRole('dialog', { name: 'Add New Note' })
    expect(within(reopened).getByLabelText('Title')).toHaveValue('Duplicate')
    expect(within(reopened).getByLabelText('Content')).toHaveValue('my words')
    expect(within(reopened).getByText('Title is already taken')).toBeInTheDocument()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
})
