import { useEffect, useRef, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  /** Id of the element that names the dialog, usually its heading. */
  labelledBy: string
  /** Id of the element that explains the dialog, if any. */
  describedBy?: string
  /** Where focus goes on close. Return null to use the default: whatever opened the dialog. */
  returnFocus?: () => HTMLElement | null
  /** Panel width, as a Tailwind max-width class. */
  maxWidth?: 'max-w-sm' | 'max-w-lg'
  children: ReactNode
}

/**
 * Thin wrapper over the native <dialog>: `showModal()` gives us the focus trap, the
 * inert backdrop and Esc for free. React owns `open`; Esc and backdrop clicks are routed
 * through `onClose`. On open, focus moves to the first `[data-autofocus]` element inside.
 */
export function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  returnFocus,
  maxWidth = 'max-w-lg',
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusTo = useRef<HTMLElement | null>(null)
  // A press that starts inside the panel (selecting text, say) and ends on the backdrop
  // is not a backdrop click, so only count presses that start on the backdrop too.
  const pressStartedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      returnFocusTo.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      dialog.showModal()
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    } else if (!open && dialog.open) {
      dialog.close()
      // Browsers disagree on whether closing a dialog restores focus, so do it ourselves.
      const target = returnFocus?.() ?? returnFocusTo.current
      if (target?.isConnected) target.focus()
      returnFocusTo.current = null
    }
    // Safe to re-run on every new `returnFocus`: each branch only acts on a real open/close change.
  }, [open, returnFocus])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onCancel={(event) => {
        // Esc: keep the dialog under React's control instead of letting it close itself.
        event.preventDefault()
        onClose()
      }}
      // The panel fills the <dialog>, so a target of the dialog itself means the backdrop.
      onPointerDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressStartedOnBackdrop.current && event.target === event.currentTarget) onClose()
        pressStartedOnBackdrop.current = false
      }}
      className={cn(
        'bg-surface text-ink border-rule m-auto w-[calc(100%-2rem)] rounded-2xl border p-0 shadow-2xl',
        'open:animate-scale-in backdrop:bg-slate-900/30 backdrop:backdrop-blur-sm',
        maxWidth,
      )}
    >
      {children}
    </dialog>
  )
}
