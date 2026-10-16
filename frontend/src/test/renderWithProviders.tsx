import { QueryClient } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'

import { AppProviders } from '@/providers/AppProviders'

/**
 * Render inside the real providers with a fresh client per test: no retries (a failure
 * should show at once) and no cache carried between tests.
 */
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: 0 },
    },
  })
  const user = userEvent.setup()
  const result = render(<AppProviders queryClient={queryClient}>{ui}</AppProviders>)
  return { ...result, user, queryClient }
}
