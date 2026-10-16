import type { ValidationError } from './types'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '')

/** Every failed request becomes one of these. `status` is 0 when the server was unreachable. */
export class ApiError extends Error {
  readonly status: number
  /** 422 messages keyed by field name, e.g. `{ title: 'String should have at least 1 character' }`. */
  readonly fieldErrors?: Record<string, string>

  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export async function request<T>(
  path: string,
  { body, headers, ...init }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: body === undefined ? headers : { 'Content-Type': 'application/json', ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // Let TanStack Query see its own cancellations as aborts, not as outages.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'Could not reach the server. Check that the API is running.')
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  const detail: unknown = await response
    .json()
    .then((data: { detail?: unknown }) => data.detail)
    .catch(() => undefined)

  if (typeof detail === 'string') return new ApiError(response.status, detail)

  if (Array.isArray(detail)) {
    const fieldErrors: Record<string, string> = {}
    for (const { loc, msg } of detail as ValidationError[]) {
      const field = loc.at(-1)
      if (field !== undefined) fieldErrors[String(field)] ??= msg
    }
    return new ApiError(response.status, 'Some fields are invalid.', fieldErrors)
  }

  return new ApiError(response.status, `Request failed (${response.status})`)
}
