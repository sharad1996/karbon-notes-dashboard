import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'

import { ToastProvider } from '@/context/ToastContext'
import { UIProvider } from '@/context/UIContext'
import { createQueryClient } from '@/lib/queryClient'

type AppProvidersProps = {
  children: ReactNode
  /** Tests pass their own client; the app creates one. */
  queryClient?: QueryClient
}

export function AppProviders({ children, queryClient: injected }: AppProvidersProps) {
  // Lazy init: one client per mounted app, never shared across renders or tests.
  const [queryClient] = useState(() => injected ?? createQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <UIProvider>{children}</UIProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}
