import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/api/client'

const MAX_QUERY_RETRIES = 2

/** A 4xx won't fix itself on retry; outages (status 0) and 5xx might. */
function isClientError(error: unknown) {
  return error instanceof ApiError && error.status >= 400 && error.status < 500
}

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: true,
        retry: (failureCount, error) => !isClientError(error) && failureCount < MAX_QUERY_RETRIES,
      },
      mutations: {
        // A retried POST could create the note twice.
        retry: 0,
      },
    },
  })
}
