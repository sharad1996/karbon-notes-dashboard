import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { makeNote } from '@/test/fixtures'
import { renderWithProviders } from '@/test/renderWithProviders'

import { NoteCard } from './NoteCard'

describe('NoteCard', () => {
  it('shows the title, content and labelled actions', () => {
    renderWithProviders(
      <NoteCard note={makeNote({ title: 'Groceries', content: 'Oat milk\nLemons' })} />,
    )

    const card = screen.getByRole('article', { name: 'Groceries' })
    expect(within(card).getByText(/Oat milk/)).toHaveTextContent('Oat milk Lemons')
    expect(screen.getByRole('button', { name: 'Edit note: Groceries' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Delete note: Groceries' })).toBeEnabled()
  })

  it('renders content as text, never as markup', () => {
    renderWithProviders(<NoteCard note={makeNote({ content: '<img src=x onerror=alert(1)>' })} />)

    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('offers no actions while the server has not confirmed the note', () => {
    renderWithProviders(<NoteCard note={{ ...makeNote({ title: 'Draft' }), pending: true }} />)

    const card = screen.getByRole('article', { name: 'Draft' })
    expect(card).toHaveAttribute('aria-busy', 'true')
    expect(within(card).getByText('Saving…')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit note/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Delete note/ })).not.toBeInTheDocument()
  })

  it('asks for confirmation before deleting, with focus on Cancel', async () => {
    const { user } = renderWithProviders(<NoteCard note={makeNote({ title: 'Groceries' })} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Delete note: Groceries' }))

    const dialog = screen.getByRole('dialog', { name: 'Delete this note?' })
    expect(dialog).toHaveTextContent('“Groceries”')
    expect(dialog).toHaveAccessibleDescription('This action cannot be undone.')
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'Groceries' })).toBeInTheDocument()
  })
})
