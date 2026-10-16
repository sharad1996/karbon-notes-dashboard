import { useEffect, useState } from 'react'

import { useToast, useToastQueue, type Toast, type ToastKind } from '@/context/ToastContext'
import { cn } from '@/lib/cn'
import { TOAST_DURATION_MS, TOAST_EXIT_MS } from '@/lib/constants'

const KIND_CLASS: Record<ToastKind, string> = {
  success: 'border-success-rule bg-success-soft text-success-ink',
  error: 'border-danger-rule bg-danger-soft text-danger-ink',
  info: 'border-accent-glow bg-accent-soft text-accent',
}

// Heroicons outline: check-circle, exclamation-circle, information-circle.
const KIND_ICON_PATH: Record<ToastKind, string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

/** Always mounted, so screen readers already know the live region when a toast arrives. */
export function Toaster() {
  const toasts = useToastQueue()

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 left-4 z-[100] flex flex-col items-end gap-2"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast()
  // Leaving plays the exit animation first; the toast is removed once it has finished.
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => dismiss(toast.id), TOAST_EXIT_MS)
    return () => clearTimeout(timer)
  }, [leaving, dismiss, toast.id])

  return (
    <div
      role={toast.kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg',
        KIND_CLASS[toast.kind],
        leaving ? 'animate-toast-out' : 'animate-toast-in',
      )}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
        className="size-5 shrink-0"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={KIND_ICON_PATH[toast.kind]} />
      </svg>
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => setLeaving(true)}
        aria-label="Dismiss notification"
        className="focus-visible:outline-accent ml-1 rounded-lg p-0.5 opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-2"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
          className="size-3.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
