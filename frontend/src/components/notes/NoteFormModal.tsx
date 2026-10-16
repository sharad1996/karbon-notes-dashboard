import { useId, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react'

import type { Note } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useUI, type CreateDraft } from '@/context/UIContext'
import { useCreateNote } from '@/hooks/useCreateNote'
import { useNotes } from '@/hooks/useNotes'
import { useUpdateNote } from '@/hooks/useUpdateNote'
import { cn } from '@/lib/cn'

// Mirror the server's validation in backend/main.py, so most errors show before a request.
const TITLE_MAX = 200
const CONTENT_MAX = 10_000
const CONTENT_COUNTER_FROM = CONTENT_MAX * 0.9

const HEADING_ID = 'note-form-heading'

type FieldErrors = { title?: string; content?: string }

function validate(title: string, content: string): FieldErrors {
  const errors: FieldErrors = {}
  const trimmed = title.trim()
  if (!trimmed) errors.title = 'Give the note a title.'
  else if (trimmed.length > TITLE_MAX) errors.title = `Keep the title to ${TITLE_MAX} characters.`
  if (content.length > CONTENT_MAX) {
    errors.content = `Keep the content to ${CONTENT_MAX.toLocaleString()} characters.`
  }
  return errors
}

/** One modal for both create and edit, driven by `editingNoteId` in UIContext. */
export function NoteFormModal() {
  const { editingNoteId, draft, closeModal } = useUI()
  const { data: notes } = useNotes()

  const note =
    typeof editingNoteId === 'number' ? notes?.find((n) => n.id === editingNoteId) : undefined
  // Editing a note that is no longer in the list (deleted elsewhere) closes the form.
  const open = editingNoteId === 'new' || note !== undefined

  return (
    <Modal open={open} onClose={closeModal} labelledBy={HEADING_ID}>
      {/* Keyed so every open starts from fresh form state. */}
      {open && <NoteForm key={editingNoteId} note={note} draft={draft} onDone={closeModal} />}
    </Modal>
  )
}

type NoteFormProps = {
  note?: Note
  /** A create the server rejected: start from the user's text and the server's errors. */
  draft: CreateDraft | null
  onDone: () => void
}

function NoteForm({ note, draft, onDone }: NoteFormProps) {
  const [title, setTitle] = useState(note?.title ?? draft?.title ?? '')
  const [content, setContent] = useState(note?.content ?? draft?.content ?? '')
  const [titleTouched, setTitleTouched] = useState(false)
  const [serverError, setServerError] = useState(draft)

  const titleId = useId()
  const contentId = useId()

  const create = useCreateNote()
  const update = useUpdateNote()

  const errors = validate(title, content)
  const isValid = !errors.title && !errors.content
  const isUnchanged = note !== undefined && title.trim() === note.title && content === note.content
  const canSave = isValid && !isUnchanged

  // A 422 maps onto the fields; anything else (outage, 503, ...) is a form-level message.
  const serverErrors = serverError?.fieldErrors
  const formError =
    serverError && !serverErrors?.title && !serverErrors?.content ? serverError.error : undefined

  const titleError =
    (titleTouched || title.trim().length > TITLE_MAX ? errors.title : undefined) ??
    serverErrors?.title
  const contentError = errors.content ?? serverErrors?.content

  // Stale server errors would describe text that is no longer there.
  function clearServerError() {
    setServerError(null)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setTitleTouched(true)
    if (!canSave) return

    // Optimistic: the list shows the change at once, so close without waiting. On failure
    // the hooks roll the list back, and a failed create reopens this form with a draft.
    const data = { title: title.trim(), content }
    if (note) update.mutate({ id: note.id, data })
    else create.mutate(data)
    onDone()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      event.currentTarget.requestSubmit()
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} noValidate>
      <div className="border-rule flex items-center justify-between border-b px-6 py-4">
        <h2 id={HEADING_ID} className="text-lg font-semibold">
          {note ? 'Edit Note' : 'Add New Note'}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onDone}
          aria-label="Close"
          className="text-dim"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            className="size-5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-6 py-5">
        <Field id={titleId} label="Title" error={titleError}>
          <input
            id={titleId}
            data-autofocus
            value={title}
            onChange={(event) => {
              setTitle(event.target.value)
              clearServerError()
            }}
            onBlur={() => setTitleTouched(true)}
            placeholder="Enter note title..."
            autoComplete="off"
            aria-invalid={titleError ? true : undefined}
            aria-describedby={titleError ? `${titleId}-error` : undefined}
            className={inputClass}
          />
        </Field>

        <Field
          id={contentId}
          label="Content"
          error={contentError}
          hint={
            content.length >= CONTENT_COUNTER_FROM
              ? `${content.length.toLocaleString()} / ${CONTENT_MAX.toLocaleString()}`
              : undefined
          }
        >
          <textarea
            id={contentId}
            value={content}
            onChange={(event) => {
              setContent(event.target.value)
              clearServerError()
            }}
            placeholder="Write your note content..."
            rows={5}
            aria-invalid={contentError ? true : undefined}
            aria-describedby={contentError ? `${contentId}-error` : undefined}
            className={cn(inputClass, 'resize-none leading-relaxed')}
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="text-danger-ink bg-danger-soft border-danger-rule rounded-xl border px-3.5 py-2.5 text-sm"
          >
            Couldn’t save the note. {formError}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3 px-6 pb-5">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={!canSave} className="px-5">
          {note ? 'Update Note' : 'Add Note'}
        </Button>
      </div>
    </form>
  )
}

const inputClass = cn(
  'border-rule bg-paper text-ink placeholder:text-dim w-full rounded-xl border px-3.5 py-2.5 text-sm transition',
  'focus:border-accent/60 focus:ring-accent/20 focus:ring-2 focus:outline-none',
  'aria-invalid:border-danger aria-invalid:focus:ring-danger/20',
)

type FieldProps = {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

function Field({ id, label, error, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-muted text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-dim text-xs tabular-nums">{hint}</span>}
      </div>
      {children}
      {error && (
        <p id={`${id}-error`} className="text-danger-ink text-xs">
          {error}
        </p>
      )}
    </div>
  )
}
