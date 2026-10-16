# backend/test_main.py
from itertools import count

import pytest
from fastapi.testclient import TestClient

import main

client = TestClient(main.app)


@pytest.fixture(autouse=True)
def reset_store(monkeypatch):
    main.notes.clear()
    monkeypatch.setattr(main, "_ids", count(1))


def create(title="Title", content="Body"):
    response = client.post("/notes", json={"title": title, "content": content})
    assert response.status_code == 201
    return response.json()


def test_create_assigns_server_id_and_ignores_body_id():
    response = client.post("/notes", json={"id": 99, "title": "  First  ", "content": "x"})

    assert response.status_code == 201
    assert response.json() == {"id": 1, "title": "First", "content": "x"}


def test_create_rejects_invalid_input():
    invalid = [
        {"title": ""},
        {"title": "   "},
        {"title": "t" * 201},
        {"title": "ok", "content": "c" * 10_001},
        {"content": "no title"},
    ]
    for body in invalid:
        response = client.post("/notes", json=body)
        assert response.status_code == 422, body

    assert client.get("/notes").json() == []


def test_list_returns_newest_first():
    create("a")
    create("b")
    create("c")

    response = client.get("/notes")

    assert response.status_code == 200
    assert [n["title"] for n in response.json()] == ["c", "b", "a"]


def test_update_replaces_note_and_404s_when_missing():
    note = create("old", "old body")

    response = client.put(f"/notes/{note['id']}", json={"id": 42, "title": "new", "content": ""})
    assert response.status_code == 200
    assert response.json() == {"id": note["id"], "title": "new", "content": ""}
    assert client.get("/notes").json() == [response.json()]

    missing = client.put("/notes/999", json={"title": "x"})
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Note not found"}


def test_delete_returns_204_with_empty_body():
    note = create()

    response = client.delete(f"/notes/{note['id']}")

    assert response.status_code == 204
    assert response.content == b""
    assert client.get("/notes").json() == []


def test_delete_missing_returns_404():
    response = client.delete("/notes/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Note not found"}


def test_ids_are_not_reused_after_delete():
    first = create("a")
    second = create("b")
    client.delete(f"/notes/{second['id']}")

    third = create("c")

    assert third["id"] not in (first["id"], second["id"])


def test_cors_allows_vite_origin_only():
    preflight = {"Access-Control-Request-Method": "POST"}

    allowed = client.options("/notes", headers={**preflight, "Origin": "http://localhost:5173"})
    assert allowed.status_code == 200
    assert allowed.headers["access-control-allow-origin"] == "http://localhost:5173"

    other = client.options("/notes", headers={**preflight, "Origin": "http://evil.example"})
    assert "access-control-allow-origin" not in other.headers
