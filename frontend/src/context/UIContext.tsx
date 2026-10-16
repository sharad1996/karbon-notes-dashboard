import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'

import type { NoteIn } from '@/api/types'

/** `'new'` while creating, a note id while editing, `null` when the modal is closed. */
export type EditingNoteId = number | 'new' | null

/** What the user typed into a create that the server then rejected, so they don't lose it. */
export type CreateDraft = NoteIn & {
  error: string
  fieldErrors?: Record<string, string>
}

type UIContextValue = {
  search: string
  /** Also goes back to page 1: the old page number means nothing for a new result set. */
  setSearch: (search: string) => void
  /** Requested grid page, 1-based. The grid clamps it to the pages that exist. */
  page: number
  setPage: (page: number) => void
  /** The header search box, so shortcuts and "Clear search" can move focus to it. */
  searchInputRef: RefObject<HTMLInputElement>
  editingNoteId: EditingNoteId
  /** Set only while the create form is reopened after a failed save. */
  draft: CreateDraft | null
  openCreate: () => void
  openEdit: (id: number) => void
  closeModal: () => void
  /** Reopen the create form with a failed draft, unless the user is already in another form. */
  reopenCreate: (draft: CreateDraft) => void
}

type ModalState = { editingNoteId: EditingNoteId; draft: CreateDraft | null }

const CLOSED: ModalState = { editingNoteId: null, draft: null }

const UIContext = createContext<UIContextValue | null>(null)

export function UIProvider({ children }: { children: ReactNode }) {
  const [search, setSearchValue] = useState('')
  const [page, setPage] = useState(1)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [{ editingNoteId, draft }, setModal] = useState<ModalState>(CLOSED)

  const setSearch = useCallback((value: string) => {
    setSearchValue(value)
    setPage(1)
  }, [])
  const openCreate = useCallback(() => setModal({ editingNoteId: 'new', draft: null }), [])
  const openEdit = useCallback((id: number) => setModal({ editingNoteId: id, draft: null }), [])
  const closeModal = useCallback(() => setModal(CLOSED), [])
  const reopenCreate = useCallback(
    (draft: CreateDraft) =>
      setModal((current) =>
        current.editingNoteId === null ? { editingNoteId: 'new', draft } : current,
      ),
    [],
  )

  const value = useMemo(
    () => ({
      search,
      setSearch,
      page,
      setPage,
      searchInputRef,
      editingNoteId,
      draft,
      openCreate,
      openEdit,
      closeModal,
      reopenCreate,
    }),
    [search, setSearch, page, editingNoteId, draft, openCreate, openEdit, closeModal, reopenCreate],
  )

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>
}

export function useUI() {
  const value = useContext(UIContext)
  if (!value) throw new Error('useUI must be used inside <UIProvider>')
  return value
}
