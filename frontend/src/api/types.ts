// Hand-written to mirror the Pydantic models in backend/main.py. Keep the two in sync.

/** A note as the API returns it. */
export type Note = {
  id: number
  title: string
  content: string
}

/** The body of POST /notes and PUT /notes/{id}. The server assigns the id. */
export type NoteIn = {
  title: string
  content: string
}

/** One entry of FastAPI's 422 `detail` array. */
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
