# backend/main.py
# The brief's starter, with its bugs fixed. Each fix is marked "Fix N", numbered as in the
# README's "Starter bugs fixed" list. Fixes 1-6 each have a test in test_main.py.
from itertools import count
from typing import Annotated

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, StringConstraints

app = FastAPI(title="Notes API")

# Fix 1: the starter had no CORS, so the browser blocked calls from the Vite dev server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


# Fix 2: the request body has no id, so clients can't choose one (the starter allowed
# duplicates). Fix 6: length limits; a blank title or an oversized body is a 422.
class NoteIn(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    content: Annotated[str, StringConstraints(max_length=10_000)] = ""


class Note(NoteIn):
    id: int


notes: dict[int, Note] = {}
# Fix 2: the server assigns ids from a counter that only goes up, so ids are never reused.
_ids = count(1)


def _get_or_404(note_id: int) -> Note:
    note = notes.get(note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


# Fix 7: every route declares its response_model and status code, so /docs is accurate.
@app.get("/notes", response_model=list[Note], status_code=200)
def get_notes() -> list[Note]:
    # Newest first.
    return sorted(notes.values(), key=lambda n: n.id, reverse=True)


@app.post("/notes", response_model=Note, status_code=201)
def add_note(note: NoteIn) -> Note:
    created = Note(id=next(_ids), **note.model_dump())
    notes[created.id] = created
    return created


@app.put("/notes/{note_id}", response_model=Note, status_code=200)
def update_note(note_id: int, note: NoteIn) -> Note:
    # Fix 4: a missing note is a 404, not the starter's 200 {"error": ...}.
    _get_or_404(note_id)
    # Fix 3: the path id is the only id; the starter stored whatever id the body carried.
    updated = Note(id=note_id, **note.model_dump())
    notes[note_id] = updated
    return updated


@app.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int) -> Response:
    # Fix 5: 404 if the note doesn't exist, 204 with an empty body if it did. The starter
    # always answered "Deleted".
    _get_or_404(note_id)
    del notes[note_id]
    return Response(status_code=204)
