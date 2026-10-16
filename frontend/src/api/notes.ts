import { request } from './client'
import type { Note, NoteIn } from './types'

export function listNotes(signal?: AbortSignal) {
  return request<Note[]>('/notes', { signal })
}

export function createNote(data: NoteIn) {
  return request<Note>('/notes', { method: 'POST', body: data })
}

export function updateNote(id: number, data: NoteIn) {
  return request<Note>(`/notes/${id}`, { method: 'PUT', body: data })
}

export function deleteNote(id: number) {
  return request<void>(`/notes/${id}`, { method: 'DELETE' })
}
