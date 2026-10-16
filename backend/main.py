# backend/main.py
from itertools import count
from typing import Annotated

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, StringConstraints

app = FastAPI(title="Notes API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)


class NoteIn(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
    content: Annotated[str, StringConstraints(max_length=10_000)] = ""


class Note(NoteIn):
    id: int


notes: dict[int, Note] = {}
_ids = count(1)


def _get_or_404(note_id: int) -> Note:
    note = notes.get(note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


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
    _get_or_404(note_id)
    updated = Note(id=note_id, **note.model_dump())
    notes[note_id] = updated
    return updated


@app.delete("/notes/{note_id}", status_code=204)
def delete_note(note_id: int) -> Response:
    _get_or_404(note_id)
    del notes[note_id]
    return Response(status_code=204)
