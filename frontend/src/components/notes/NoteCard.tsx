import { useLayoutEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useUI } from '@/context/UIContext'
import type { CachedNote } from '@/hooks/noteCache'
import { useDeleteNote } from '@/hooks/useDeleteNote'
import { cn } from '@/lib/cn'

// Always visible on touch screens; on mouse devices only on hover or focus.
const ACTION_CLASS =
  'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'

/** The card to land on once this one leaves the list: the next one, else the previous. */
function neighbourCard(card: HTMLElement | null) {
  const item = card?.closest('li')
  const neighbour = item?.nextElementSibling ?? item?.previousElementSibling
  return neighbour?.querySelector<HTMLElement>('article') ?? null
}

type NoteCardProps = {
  note: CachedNote
  /** Position on the page; staggers the entrance animation. */
  index?: number
}

export function NoteCard({ note, index = 0 }: NoteCardProps) {
  const { openEdit, searchInputRef } = useUI()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const deleteNote = useDeleteNote()
  const cardRef = useRef<HTMLElement>(null)
  // Set on confirm, so the closing dialog doesn't hand focus back to a card that's leaving.
  const focusAfterDelete = useRef<HTMLElement | null>(null)

  // Not yet confirmed by the server (and, if new, without a real id): nothing to act on yet.
  const pending = note.pending === true

  // Saving hides the action buttons. If one had focus (the editor returns focus to the Edit
  // button), keep it on the card rather than letting it fall back to <body>. A layout effect
  // runs before the browser notices the focused button is gone.
  useLayoutEffect(() => {
    const card = cardRef.current
    if (pending && card?.contains(document.activeElement) && document.activeElement !== card) {
      card.focus()
    }
  }, [pending])

  function confirmDelete() {
    focusAfterDelete.current = neighbourCard(cardRef.current) ?? searchInputRef.current
    setConfirmingDelete(false)
    // Optimistic: the card leaves the list now; on failure the hook puts it back.
    deleteNote.mutate(note.id)
  }

  return (
    <>
      {/* The whole card opens the editor for pointer users; keyboard and screen-reader users
          get the labelled Edit button, so there is one tab stop per action, not two. */}
      {/* tabIndex -1: not a tab stop, but a place to park focus (see above, and delete). */}
      <article
        ref={cardRef}
        tabIndex={-1}
        aria-labelledby={`note-${note.id}-title`}
        onClick={pending ? undefined : () => openEdit(note.id)}
        aria-busy={pending || undefined}
        className={cn(
          'group border-rule bg-surface relative flex h-full flex-col rounded-xl border p-5 shadow-sm',
          'animate-fade-in-up transition-all duration-300',
          `stagger-${Math.min(index + 1, 10)}`,
          'focus-visible:outline-accent focus-visible:outline-2 focus-visible:outline-offset-2',
          pending
            ? 'opacity-60'
            : 'hover:shadow-accent-glow hover:border-accent/40 cursor-pointer hover:-translate-y-0.5 hover:shadow-md',
        )}
      >
        {/* Accent bar on the left edge, shown on hover or keyboard focus. */}
        <div
          aria-hidden="true"
          className="absolute top-4 bottom-4 left-0 w-0.5 rounded-full bg-gradient-to-b from-violet-500 to-pink-500 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        />

        <div className="mb-3 flex items-start justify-between gap-2">
          <h2
            id={`note-${note.id}-title`}
            title={note.title}
            className="line-clamp-2 min-w-0 flex-1 text-base leading-snug font-semibold break-words"
          >
            {note.title}
          </h2>
          {/* The attribute, not a class: it also takes the buttons out of the accessibility tree. */}
          <div hidden={pending} className="-my-1 -mr-1 flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Edit note: ${note.title}`}
              onClick={(event) => {
                event.stopPropagation()
                openEdit(note.id)
              }}
              className={`text-dim hover:bg-accent-soft hover:text-accent ${ACTION_CLASS}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete note: ${note.title}`}
              onClick={(event) => {
                event.stopPropagation()
                setConfirmingDelete(true)
              }}
              className={`text-dim hover:bg-danger-soft hover:text-danger ${ACTION_CLASS}`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </Button>
          </div>
        </div>

        {/* Rendered as plain text on purpose: no dangerouslySetInnerHTML, so note content can't inject markup. */}
        {note.content ? (
          <p className="text-muted line-clamp-4 flex-1 text-sm leading-relaxed whitespace-pre-wrap">
            {note.content}
          </p>
        ) : (
          <p className="text-dim flex-1 text-sm italic">No content</p>
        )}

        <div className="border-rule mt-4 flex items-center border-t pt-3">
          {pending ? (
            // A new note's id is a temporary negative number; don't show it.
            <span className="text-accent flex items-center gap-1.5 text-xs">
              <Spinner className="size-3.5" />
              Saving…
            </span>
          ) : (
            <span className="text-dim font-mono text-xs">#{note.id}</span>
          )}
        </div>
      </article>

      {/* Outside the <article>: React events bubble through the component tree, so a click
          inside the dialog would otherwise reach the card's onClick and open the editor. */}
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this note?"
        subject={note.title}
        description="This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmingDelete(false)}
        returnFocus={() => {
          const target = focusAfterDelete.current
          focusAfterDelete.current = null
          return target
        }}
      />
    </>
  )
}
