import { createContext, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

export type ToastKind = 'success' | 'error' | 'info'
export type Toast = { id: number; kind: ToastKind; message: string }

type ToastApi = {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  dismiss: (id: number) => void
}

// Two contexts: components that only *raise* toasts get a stable API object and never
// re-render when the queue changes; only the Toaster subscribes to the queue itself.
const ToastApiContext = createContext<ToastApi | null>(null)
const ToastQueueContext = createContext<Toast[] | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const api = useMemo<ToastApi>(() => {
    const push = (kind: ToastKind, message: string) => {
      const id = nextId.current++
      setToasts((queue) => [...queue, { id, kind, message }])
    }
    return {
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
      dismiss: (id) => setToasts((queue) => queue.filter((toast) => toast.id !== id)),
    }
  }, [])

  return (
    <ToastApiContext.Provider value={api}>
      <ToastQueueContext.Provider value={toasts}>{children}</ToastQueueContext.Provider>
    </ToastApiContext.Provider>
  )
}

export function useToast() {
  const api = useContext(ToastApiContext)
  if (!api) throw new Error('useToast must be used inside <ToastProvider>')
  return api
}

export function useToastQueue() {
  const toasts = useContext(ToastQueueContext)
  if (!toasts) throw new Error('useToastQueue must be used inside <ToastProvider>')
  return toasts
}
