import { useId, type ReactNode } from 'react'

import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmDialogProps = {
  open: boolean
  title: string
  /** What is affected, e.g. the note's title. Shown in quotes under the heading. */
  subject?: string
  description: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  returnFocus?: () => HTMLElement | null
}

/** A destructive yes/no question. Focus starts on Cancel so a stray Enter is harmless. */
export function ConfirmDialog({
  open,
  title,
  subject,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
  returnFocus,
}: ConfirmDialogProps) {
  const headingId = useId()
  const descriptionId = useId()

  return (
    <Modal
      open={open}
      onClose={onCancel}
      labelledBy={headingId}
      describedBy={descriptionId}
      returnFocus={returnFocus}
      maxWidth="max-w-sm"
    >
      <div className="px-6 py-6 text-center">
        <div className="bg-danger-soft mx-auto mb-4 flex size-14 items-center justify-center rounded-full">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
            className="text-danger size-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </div>
        <h2 id={headingId} className="text-lg font-semibold">
          {title}
        </h2>
        {subject && <p className="text-muted mt-2 line-clamp-2 text-sm">“{subject}”</p>}
        <p id={descriptionId} className="text-dim mt-1.5 text-xs">
          {description}
        </p>
      </div>
      <div className="border-rule flex gap-3 border-t px-6 py-4">
        <Button data-autofocus onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="flex-1">
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
