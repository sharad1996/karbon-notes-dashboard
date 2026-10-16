import { ApiError } from '@/api/client'
import type { Note } from '@/api/types'

let nextId = 1

/** A note as the API returns it. Ids count up, as on the server. */
export function makeNote(overrides: Partial<Note> = {}): Note {
  const id = overrides.id ?? nextId++
  return { id, title: `Note ${id}`, content: '', ...overrides }
}

/** What `request` throws for FastAPI's `{"detail": "..."}` errors. */
export function apiError(status: number, detail: string) {
  return new ApiError(status, detail)
}

/** What `request` throws for a 422 on one body field. */
export function validationError(field: string, msg: string) {
  return new ApiError(422, 'Some fields are invalid.', { [field]: msg })
}

/** A promise the test settles by hand, to hold a request in flight. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
