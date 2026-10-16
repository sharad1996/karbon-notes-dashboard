# Notes Dashboard

A React + TypeScript notes dashboard backed by a FastAPI API. You can create, edit, delete and search notes, and changes appear in the UI before the server responds, with rollback if a request fails.

## Quick start

**Prerequisites:** Node 22+, [uv](https://docs.astral.sh/uv/getting-started/installation/) (it downloads Python 3.12 if you don't have it).

```bash
npm install       # root tooling (concurrently)
npm run setup     # backend deps via uv, frontend deps via npm ci
npm run dev       # API and web app together; Ctrl-C stops both
```

| What | URL |
|---|---|
| Web app | http://localhost:5173 |
| API | http://127.0.0.1:8000 |
| Interactive API docs | http://127.0.0.1:8000/docs |

The API starts empty. Data is kept in memory, so it resets when the API restarts.

The backend is the brief's `backend/main.py`, run from the repo root with the brief's own command: `uvicorn backend.main:app --reload`.

<details>
<summary>Running without the root scripts (two terminals, or pip instead of uv)</summary>

```bash
# Terminal 1: API (from the repo root)
uv run --project backend uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

#   ...or with plain pip:
#   python -m venv .venv && source .venv/bin/activate   (Windows: .venv\Scripts\activate)
#   pip install fastapi "uvicorn[standard]"
#   uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# Terminal 2: web app
cd frontend
npm ci
npm run dev
```

</details>

### See loading, optimistic updates and rollback

A local API answers in about a millisecond, so you normally never see a pending state. To see them, turn on network throttling (for example "Slow 4G") in your browser's DevTools. To see a failure, stop the API while a request is in flight.

Things to try:

- **Create a note.** The card appears straight away, dimmed. If the request fails, the form reopens with your text.
- **Edit a note.** The card updates straight away. If the request fails, it reverts and a toast explains why.
- **Delete two notes quickly.** Both cards disappear and stay gone. If a delete fails, that card comes back in its original position.
- **Stop the API.** The app shows an error banner with a Retry button instead of a blank page.

## Tests and checks

```bash
npm test          # pytest (API), then Vitest (web)
```

| Command | Checks |
|---|---|
| `npm run test:api` | 8 pytest tests: the API contract, covering starter fixes 1–6 |
| `npm run test:web` | 18 Vitest + React Testing Library tests, with the API module mocked via `vi.mock` |
| `npm --prefix frontend run lint` / `typecheck` | ESLint, `tsc` in strict mode |
| `uv run --project backend ruff check backend` | Python lint |

## Features

**Core:** responsive card grid (1, 2 or 3 columns), create and edit in a shared modal, delete with confirmation. Every operation goes through the API. Each state has its own screen: skeleton cards while loading, an error banner with Retry, an empty state, and a "no matches" state.

**Stretch features:**

- **Search.** Debounced (filters 300 ms after you stop typing; the box itself never lags), case-insensitive, matches title and content, and every word typed must appear. Shows a "3 of 12 notes" count.
- **Pagination.** 9 notes per page with numbered pages ("Showing 10 – 18 of 23 notes"), done in the browser over the search results. Goes back to page 1 when the search changes or a note is created.
- **Optimistic updates** for create, edit and delete. A failure rolls back only the affected note.
- **Tests.** Component tests for `NoteCard` and `NoteFormModal`, a test of `useDeleteNote` rolling back, and backend tests.
- **React Native.** How I would adapt this for mobile is in [docs/react-native.md](docs/react-native.md).
- **Extras.**
  - Keyboard shortcuts (below).
  - Dark mode that follows the operating system setting.
  - Accessibility: labelled controls, focus returns to the card after the modal closes, toasts are announced to screen readers.

| Shortcut | Action |
|---|---|
| `/` | Focus search |
| `N` | New note |
| `⌘/Ctrl + Enter` | Save the open form |
| `Esc` | Close the modal or dialog |

## Libraries and decisions

| Area | Choice | Why |
|---|---|---|
| Backend | The **FastAPI starter as given, with only its bugs fixed** | Kept to the single `backend/main.py` from the brief. Each fix is commented in the code, and fixes 1–6 have tests (see [API](#api)). |
| IDs | **Assigned by the server** from a counter that only increases | The starter let clients choose ids, which allowed duplicates. Ids are never reused after a delete. |
| Server state | **TanStack Query v5** | Handles caching, loading and error flags, retries and refetching, and provides the hooks needed for optimistic updates. |
| UI state | **React Context**: `UIContext` (search, page, modal) and `ToastContext` | Server state and UI state are separate problems. Toasts have their own context so that showing or dismissing one doesn't re-render the components that read search. |
| Optimistic updates | **Each note rolls back on its own**, and the list refetches only once no other write is still in progress | Restoring a snapshot of the whole list would undo other writes that succeeded at the same time. Refetching too early would briefly bring back a note that is mid-delete. |
| Editing | One **modal for both create and edit**, built on the native `<dialog>` element | One form and one set of validation rules. `<dialog>` provides the focus trap and Esc handling without a library. |
| Types | **Hand-written** in `frontend/src/api/types.ts`, mirroring the Pydantic models | Three small shapes, so a codegen step isn't worth the extra dependency and build step. |
| Test mocking | **`vi.mock('@/api/notes')`**, not MSW | The API module is the seam; mocking it keeps tests fast and dependency-free while still exercising the real hooks, cache and components. |
| Search and pagination | **Filtered and paged in the browser** over the cached list, with a 300 ms debounce on the filter | Fast at this size with no API change, and new notes that are still saving show up in results and on page 1 too. |
| Styling | **Tailwind CSS v4**, no component library | Fast to build a clean, responsive layout with dark mode. The buttons, modal and toasts are written for this app. |
| Tooling | **Vite**, React 18, strict TypeScript, **Vitest** | Vitest has the same `describe`/`it`/`expect` API as Jest (the brief mentions Jest) and runs inside Vite with no extra configuration. |
| Storage | **In memory**, a module-level dict | Persistence isn't part of the brief. |

The project structure is grouped by layer: `api/` → `hooks/` → `context/` → `components/`. Data logic stays out of components, which is also what makes a React Native port cheap.

## API

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/notes` | `200 Note[]`, newest first | — |
| `POST` | `/notes` | `201 Note` | `422` |
| `PUT` | `/notes/{id}` | `200 Note` (replaces title and content) | `404`, `422` |
| `DELETE` | `/notes/{id}` | `204`, empty body | `404` |

- **Request body (POST and PUT):** `{ title, content }`. Any `id` sent in the body is ignored.
- **Response:** `Note` is `{ id, title, content }`.
- **Validation:** title is trimmed and must be 1–200 characters; content is at most 10,000 characters (default `""`). The form checks the same limits.
- **Errors** use FastAPI's default shape: `{"detail": "Note not found"}` for 404, and `{"detail": [{loc, msg, type}]}` for 422.

**Starter bugs fixed** (everything else is the starter as given):

1. No CORS → the browser couldn't call the API from the Vite dev server. The Vite origins are now allowed.
2. Clients chose ids → duplicates were possible. The server now assigns them from a counter, so ids are never reused.
3. The id in the PUT body could disagree with the id in the path → the body's id is no longer used.
4. PUT on a missing note returned `200 {"error": ...}` → it now returns `404`.
5. DELETE always answered "Deleted" → it now returns `204` on success and `404` if the note doesn't exist.
6. No validation → a blank title or an oversized body was accepted. Pydantic length limits now return `422`.
7. No `response_model` or status codes → every route now declares both, so `/docs` is accurate.

The frontend reads `VITE_API_URL`, which defaults to `http://127.0.0.1:8000`.

**After changing the backend models,** update `frontend/src/api/types.ts` to match.

## Security notes

This is a local demo. What's in place:

- The API listens on `127.0.0.1` only.
- CORS is limited to the Vite origin.
- Note content is rendered as plain text, never as HTML.

- Input is validated by Pydantic, with length limits on title and content.

For production I would add authentication (OIDC/JWT), a persistent database, rate limiting, security headers and a CSP, a sanitising pipeline if rich text were introduced, and dependency scanning in CI.

## What I'd do next

- Server-side search and pagination once there are hundreds of notes or more.
- Persistence with SQLite or Postgres.
- ETags or version numbers on PUT, so two tabs editing the same note conflict instead of the last save silently winning.
